import os

def fix_env_models():
    lines = []
    if os.path.exists('.env'):
        with open('.env', 'r', encoding='utf-8', errors='ignore') as f:
            lines = f.readlines()
    
    new_lines = []
    for line in lines:
        if '_AGENT_MODEL_TYPE=' in line:
            key = line.split('=')[0]
            new_lines.append(f'{key}=gemini\n')
        elif '_AGENT_MODEL_ID=' in line:
            key = line.split('=')[0]
            new_lines.append(f'{key}=gemini-1.5-flash\n')
        else:
            new_lines.append(line)
            
    with open('.env', 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
        
    print("Fixed .env models")

if __name__ == "__main__":
    fix_env_models()
