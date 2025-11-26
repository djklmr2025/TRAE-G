import os

def fix_env():
    lines = []
    if os.path.exists('.env'):
        with open('.env', 'r', encoding='utf-8', errors='ignore') as f:
            lines = f.readlines()
    
    new_lines = []
    found = False
    for line in lines:
        if line.startswith('DB_CONNECTION_STRING='):
            new_lines.append('DB_CONNECTION_STRING=sqlite:///./neuralagent.db\n')
            found = True
        else:
            new_lines.append(line)
            
    if not found:
        new_lines.append('DB_CONNECTION_STRING=sqlite:///./neuralagent.db\n')
        
    with open('.env', 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
        
    print("Fixed .env file")

if __name__ == "__main__":
    fix_env()
