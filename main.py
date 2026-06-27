from rag.chat import chat_loop
from rag.config import Settings, load_env_file

if __name__ == "__main__":
    load_env_file()
    settings = Settings()
    chat_loop(settings)