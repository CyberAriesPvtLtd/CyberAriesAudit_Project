import os
import json
import time
import random
import logging
from typing import Optional, Dict, Any
from google import genai
from google.genai import types

from app.config import GOOGLE_API_KEY

logger = logging.getLogger(__name__)


class AIAuditorService:
    """
    AI Auditor Service that converts raw, informal auditor observations
    into standardized, formal, report-ready SEBI CSCRF audit findings
    (Executive Report Note, Root Cause Analysis, Impact Analysis, Recommendations).
    """

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or GOOGLE_API_KEY or os.environ.get("GOOGLE_API_KEY")
        if not self.api_key:
            logger.warning("[AIAuditorService] No GOOGLE_API_KEY configured. Falling back to rule-based engine.")
            self.client = None
        else:
            try:
                self.client = genai.Client(api_key=self.api_key)
            except Exception as e:
                logger.error(f"[AIAuditorService] Failed to initialize Google GenAI Client: {e}")
                self.client = None

    def is_available(self) -> bool:
        return self.client is not None

    def synthesize_control_evaluation(
        self,
        control_id: str,
        control_name: str,
        control_requirement: str,
        compliance_status: str,
        raw_note: str,
        evidence_name: Optional[str] = None,
        refresh_count: int = 0
    ) -> Dict[str, Any]:
        """
        Synthesizes an all-in-one audit determination package:
        - Executive Report Note (for final SEBI report)
        - Root Cause Analysis (for non-compliant / partially compliant)
        - Impact Analysis (for non-compliant / partially compliant)
        - Recommendations / Corrective Action
        - Remediation Days (e.g. 30 or 45 days)
        """
        clean_note = (raw_note or "").strip()
        is_compliant = compliance_status == "Compliant"
        is_partial = compliance_status == "Partially Compliant"
        default_days = 45 if is_partial else 30

        # Try live Gemini call if client is initialized
        if self.client:
            try:
                return self._call_gemini_synthesis(
                    control_id=control_id,
                    control_name=control_name,
                    control_requirement=control_requirement,
                    compliance_status=compliance_status,
                    raw_note=clean_note,
                    evidence_name=evidence_name,
                    refresh_count=refresh_count,
                    default_days=default_days
                )
            except Exception as e:
                logger.warning(f"[AIAuditorService] Gemini call failed ({e}). Falling back to contextual rule synthesis.")

        # Fallback synthesis (ensures uninterrupted UI operation)
        return self._rule_based_synthesis(
            control_id=control_id,
            control_name=control_name,
            control_requirement=control_requirement,
            compliance_status=compliance_status,
            raw_note=clean_note,
            default_days=default_days
        )

    def _call_gemini_synthesis(
        self,
        control_id: str,
        control_name: str,
        control_requirement: str,
        compliance_status: str,
        raw_note: str,
        evidence_name: Optional[str],
        refresh_count: int,
        default_days: int
    ) -> Dict[str, Any]:
        """Calls Google Gemini with strict JSON enforcement."""
        system_prompt = f"""
You are a Lead Cybersecurity & Compliance Auditor reviewing GRC assessment findings for SEBI CSCRF compliance.

Your task is to generate a formal, standardized compliance evaluation package based on the auditor's raw draft.

REGULATORY CONTEXT:
- Control ID: {control_id}
- Control Name: {control_name}
- SEBI Requirement: "{control_requirement}"

EVALUATION CONTEXT:
- Compliance Status: {compliance_status}
- Evidence Reference: {evidence_name or 'Submitted evidence artifacts'}
- Auditor Raw Draft: "{raw_note or 'Baseline verification required'}"

OUTPUT FORMAT: Return ONLY a valid JSON object with the exact keys:
{{
  "report_note": "A formal, executive narrative describing the compliance observation for the final SEBI report.",
  "root_cause_analysis": "Clear explanation of technical, procedural, or governance root cause (null if Compliant).",
  "impact_analysis": "Risk to confidentiality, integrity, availability, or regulatory compliance under SEBI CSCRF (null if Compliant).",
  "recommendation": "Concrete, actionable remediation steps for management (null if Compliant).",
  "remediation_days": {default_days}
}}
"""
        candidate_models = ["gemini-3.8-flash", "gemini-3.5-flash", "gemini-2.5-flash"]
        for model in candidate_models:
            try:
                response = self.client.models.generate_content(
                    model=model,
                    contents=system_prompt,
                    config=types.GenerateContentConfig(
                        temperature=0.2,
                        response_mime_type="application/json"
                    )
                )
                if response and response.text:
                    parsed = json.loads(response.text.strip())
                    return {
                        "report_note": parsed.get("report_note", ""),
                        "root_cause_analysis": parsed.get("root_cause_analysis"),
                        "impact_analysis": parsed.get("impact_analysis"),
                        "recommendation": parsed.get("recommendation"),
                        "remediation_days": parsed.get("remediation_days", default_days),
                        "is_mock": False
                    }
            except Exception as e:
                err_str = str(e)
                if "404" in err_str or "not found" in err_str.lower():
                    continue
                raise e

        raise RuntimeError("All candidate Gemini models failed.")

    def _rule_based_synthesis(
        self,
        control_id: str,
        control_name: str,
        control_requirement: str,
        compliance_status: str,
        raw_note: str,
        default_days: int
    ) -> Dict[str, Any]:
        """
        Contextual deterministic generator grounded in SEBI CSCRF framework
        used when API is awaiting billing activation or offline.
        """
        short_req = control_requirement[:180] + ("..." if len(control_requirement) > 180 else "")

        if compliance_status == "Compliant":
            report_note = (
                f"During the compliance evaluation for {control_id} ({control_name}), verified that the entity "
                f"has fully implemented controls aligning with SEBI CSCRF baseline requirements. "
                f"{raw_note if raw_note else 'Submitted deliverables substantiate adequate operational and technical safeguards.'}"
            )
            return {
                "report_note": report_note,
                "root_cause_analysis": None,
                "impact_analysis": None,
                "recommendation": None,
                "remediation_days": None,
                "is_mock": True
            }

        elif compliance_status == "Partially Compliant":
            report_note = (
                f"Assessment of control {control_id} ({control_name}) established partial compliance with SEBI CSCRF. "
                f"While preliminary frameworks or drafts exist, notable procedural or documentation gaps were identified: "
                f"'{raw_note or 'Documentation lacks formal periodic ratification or complete coverage'}'. "
                f"The control requires administrative closure to fulfill baseline requirement: \"{short_req}\"."
            )
            root_cause = (
                f"Procedural gap in periodic review and governance oversight. "
                f"{raw_note if raw_note else 'Deliverables were partially submitted but lack formal sign-off or comprehensive coverage.'}"
            )
            impact = (
                f"Incomplete control governance increases vulnerability to operational misalignment and "
                f"constitutes partial non-conformance with SEBI CSCRF cyber resilience standards."
            )
            recommendations = (
                f"1. Formalize and approve updated policy/procedure documentation with board or designated authority sign-off. "
                f"2. Align internal operational cadence to satisfy SEBI CSCRF control requirement: \"{short_req}\". "
                f"3. Upload revised evidence artifacts within {default_days} days."
            )
            return {
                "report_note": report_note,
                "root_cause_analysis": root_cause,
                "impact_analysis": impact,
                "recommendation": recommendations,
                "remediation_days": default_days,
                "is_mock": True
            }

        else:  # Non-Compliant
            report_note = (
                f"Non-compliance identified for control {control_id} ({control_name}) under SEBI CSCRF guidelines. "
                f"Audit observation: '{raw_note or 'Mandatory primary evidence artifacts were either missing, expired, or non-conforming'}'. "
                f"The entity does not meet the prescribed regulatory standard: \"{short_req}\"."
            )
            root_cause = (
                f"Absence or critical lapse of mandatory technical/procedural controls required under SEBI CSCRF. "
                f"{raw_note if raw_note else 'Mandatory deliverable not executed within the designated regulatory period.'}"
            )
            impact = (
                f"High regulatory and cybersecurity risk. Exposes critical systems to unmitigated threat vectors "
                f"and potential regulatory sanctions or penalties under SEBI CSCRF enforcement provisions."
            )
            recommendations = (
                f"1. Immediately commission and execute required assessments or remediation procedures mandated under {control_id}. "
                f"2. Obtain certified audit sign-off (CERT-In / statutory body where applicable) and submit formal remediation closure within {default_days} days. "
                f"3. Institute recurring calendar reviews to prevent recurring non-compliance."
            )
            return {
                "report_note": report_note,
                "root_cause_analysis": root_cause,
                "impact_analysis": impact,
                "recommendation": recommendations,
                "remediation_days": default_days,
                "is_mock": True
            }


# Singleton service instance
ai_service = AIAuditorService()
