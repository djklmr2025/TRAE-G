import os
import sys
from dotenv import load_dotenv

# Add backend directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from utils.llm_provider import get_llm
from langchain_google_genai import ChatGoogleGenerativeAI

def test_gemini_provider():
    # Mock environment variables
    os.environ["SUGGESTOR_AGENT_MODEL_TYPE"] = "gemini"
    os.environ["SUGGESTOR_AGENT_MODEL_ID"] = "gemini-1.5-flash"
    os.environ["GEMINI_API_KEY"] = "fake_key"

    try:
        llm = get_llm("suggestor")
        print(f"Successfully initialized LLM: {type(llm)}")
        
        if isinstance(llm, ChatGoogleGenerativeAI):
            print("Verified: LLM is an instance of ChatGoogleGenerativeAI")
        else:
            print("Failed: LLM is NOT an instance of ChatGoogleGenerativeAI")
            
    except Exception as e:
        print(f"Error initializing LLM: {e}")

if __name__ == "__main__":
    test_gemini_provider()
