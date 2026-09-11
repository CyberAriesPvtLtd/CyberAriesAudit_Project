from nanoid import generate

def generate_company_id():
    return f"cm_{generate(size=12)}"

def generate_user_id():
    return f"us_{generate(size=12)}"

def generate_audit_framework_id():
    return f"af_{generate(size=12)}"

def generate_control_id():
    return f"co_{generate(size=12)}"

def generate_audit_control_id():
    return f"ac_{generate(size=12)}"

def generate_evidence_file_id():
    return f"ev_{generate(size=12)}"

def generate_audit_control_evidence_id():
    return f"ae_{generate(size=12)}"