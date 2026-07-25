import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, FileText, Download, Eye, AlertCircle, CheckCircle, XCircle, Image as ImageIcon } from 'lucide-react';
import './AuditReview.css';

const AuditReview = () => {
  const { auditId } = useParams();

  return (
    <div className="page-container audit-review-page">
      <div className="review-header">
        <div className="breadcrumb">
          <Link to="/assigned-audits" className="back-link">
            <ChevronLeft size={16} /> Back to Assigned Audits
          </Link>
        </div>
        <div className="header-title-row">
          <div>
            <h1 className="page-title">Evidence Review: Password Policy</h1>
            <p className="page-subtitle">ABC Securities - CSCRF Audit FY 25</p>
          </div>
          <div className="status-indicator">
            <span className="status-label">AI Status:</span>
            <span className="badge badge-yellow" style={{ fontSize: '14px', padding: '6px 12px' }}>PARTIALLY COMPLIANT</span>
          </div>
        </div>
      </div>

      <div className="three-column-layout">
        {/* LEFT PANEL: Control Information */}
        <div className="panel left-panel">
          <div className="card h-full">
            <h3 className="panel-title">Control Information</h3>
            
            <div className="info-group">
              <label>Control ID</label>
              <p className="info-value font-mono">PR.AA.56</p>
            </div>
            
            <div className="info-group">
              <label>Control Name</label>
              <p className="info-value">Password Complexity Policy</p>
            </div>
            
            <div className="info-group">
              <label>Control Description</label>
              <p className="info-value text-sm">
                Ensure secure password policy and password complexity enforcement across all enterprise systems. Passwords must be at least 12 characters, include alphanumeric and special characters, and expire every 90 days.
              </p>
            </div>
            
            <div className="info-group">
              <label>Security Domain</label>
              <p className="info-value">Access Control (PROTECT)</p>
            </div>
            
            <div className="divider"></div>
            
            <h4 className="sub-heading">Required Evidence</h4>
            <ul className="evidence-list">
              <li>1. Approved Password Policy Document</li>
              <li>2. Screenshot of AD/IdP password enforcement settings</li>
              <li>3. Exception log for service accounts</li>
            </ul>
          </div>
        </div>

        {/* CENTER PANEL: Uploaded Evidence */}
        <div className="panel center-panel">
          <div className="card h-full">
            <h3 className="panel-title">Uploaded Evidence</h3>
            
            <div className="tabs">
              <div className="tab active">Documents (1)</div>
              <div className="tab">Images (1)</div>
              <div className="tab">Logs (1)</div>
            </div>
            
            <div className="evidence-items">
              {/* Item 1 */}
              <div className="evidence-card">
                <div className="evidence-icon doc">
                  <FileText size={24} />
                </div>
                <div className="evidence-info">
                  <p className="evidence-name">Corporate_Password_Policy_v2.pdf</p>
                  <p className="evidence-meta">245 KB • v2.0 • Uploaded 06 Jul 2025</p>
                </div>
                <div className="evidence-actions">
                  <button className="icon-btn"><Eye size={18} /></button>
                  <button className="icon-btn"><Download size={18} /></button>
                </div>
              </div>
              
              {/* Item 2 */}
              <div className="evidence-card">
                <div className="evidence-icon img">
                  <ImageIcon size={24} />
                </div>
                <div className="evidence-info">
                  <p className="evidence-name">AD_Password_Settings.png</p>
                  <p className="evidence-meta">1.2 MB • v1.0 • Uploaded 08 Jul 2025</p>
                </div>
                <div className="evidence-actions">
                  <button className="icon-btn"><Eye size={18} /></button>
                  <button className="icon-btn"><Download size={18} /></button>
                </div>
              </div>

              {/* Item 3 */}
              <div className="evidence-card">
                <div className="evidence-icon doc">
                  <FileText size={24} />
                </div>
                <div className="evidence-info">
                  <p className="evidence-name">Service_Account_Exceptions.xlsx</p>
                  <p className="evidence-meta">45 KB • v1.0 • Uploaded 08 Jul 2025</p>
                </div>
                <div className="evidence-actions">
                  <button className="icon-btn"><Eye size={18} /></button>
                  <button className="icon-btn"><Download size={18} /></button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: AI Compliance Analysis */}
        <div className="panel right-panel">
          <div className="card h-full ai-analysis-card">
            <div className="ai-header">
              <h3 className="panel-title">AI Analysis</h3>
              <div className="confidence-score">
                <span>Confidence</span>
                <strong>91%</strong>
              </div>
            </div>
            
            <div className="analysis-section">
              <h4 className="sub-heading flex-align"><CheckCircle size={16} className="text-green" /> Evidence Found</h4>
              <ul className="bullet-list text-green">
                <li>Password Policy document matches requirements.</li>
                <li>Exception log provided for 3 service accounts.</li>
              </ul>
            </div>
            
            <div className="analysis-section">
              <h4 className="sub-heading flex-align"><XCircle size={16} className="text-red" /> Evidence Missing/Deficient</h4>
              <ul className="bullet-list text-red">
                <li>AD screenshot shows 8 character minimum, not 12.</li>
                <li>AD screenshot shows 180 day expiration, not 90.</li>
              </ul>
            </div>
            
            <div className="analysis-section">
              <h4 className="sub-heading">AI Reasoning</h4>
              <p className="reason-text">
                The corporate policy document is fully compliant with the control requirements. However, the technical implementation evidence (AD_Password_Settings.png) contradicts the policy. The settings enforced in the system are weaker than required. Therefore, the control is partially compliant (policy exists but enforcement fails).
              </p>
            </div>
            
            <div className="analysis-section bg-light-blue">
              <h4 className="sub-heading">Recommendation</h4>
              <p className="text-sm">
                Request updated system screenshot showing password enforcement settings matching the policy (12 characters, 90-day expiry), or issue a non-compliance observation for technical enforcement.
              </p>
              <button className="btn btn-outline btn-sm mt-2">View Source References</button>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION: Auditor Comments */}
      <div className="card comments-section mt-4">
        <h3 className="panel-title">Auditor Review</h3>
        <div className="comments-layout">
          <div className="comments-input-area">
            <label>Auditor Comments & Observations</label>
            <textarea 
              className="comments-textarea" 
              placeholder="Write your comments here... These will be included in the final report observations if not resolved."
              defaultValue="AI analysis is correct. The AD settings do not match the approved corporate policy. Client needs to update AD settings to enforce 12 chars / 90 days and provide a new screenshot."
            ></textarea>
          </div>
          <div className="actions-area">
            <h4 className="actions-title">Decision Actions</h4>
            <div className="action-buttons">
              <button className="btn btn-primary w-full mb-2">Approve AI Findings</button>
              <button className="btn btn-danger w-full mb-2">Reject & Request Fix</button>
              <button className="btn btn-outline w-full mb-2">Override to Compliant</button>
              <button className="btn btn-outline w-full mb-2">Override to Non-Compliant</button>
              <button className="btn btn-outline w-full">Generate Observation</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditReview;
