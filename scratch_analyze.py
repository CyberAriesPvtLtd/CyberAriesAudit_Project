import pandas as pd

file_path = r'C:\Users\user\Desktop\CyberAriesAudit_Project\backend\app\data\controls\AIF_PMS_Bidirectional_CrossReference.xlsx'

xls = pd.ExcelFile(file_path)

for sheet in xls.sheet_names:
    df = pd.read_excel(file_path, sheet_name=sheet)
    
    # Find the actual header row by looking for "S.No" or similar
    print(f"\n{'='*80}")
    print(f"Sheet: {sheet}")
    print(f"Raw columns: {list(df.columns)}")
    print(f"Total rows: {len(df)}")
    
    # Count statuses
    all_vals = df.values.flatten()
    statuses = {}
    for v in all_vals:
        v_str = str(v).strip()
        if 'Exact Match' in v_str:
            statuses['Exact Match'] = statuses.get('Exact Match', 0) + 1
        elif 'Partial Match' in v_str:
            statuses['Partial Match'] = statuses.get('Partial Match', 0) + 1
        elif 'No Match' in v_str and 'No Match' == v_str:
            statuses['No Match'] = statuses.get('No Match', 0) + 1
    
    print(f"\nStatus counts: {statuses}")
