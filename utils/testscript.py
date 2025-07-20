import subprocess
import os

# Configuration
SOURCE_URI = "mongodb+srv://user:pass@cluster0.mongodb.net/source_db"
TARGET_URI = "mongodb+srv://user:pass@cluster1.mongodb.net/target_db"
DUMP_PATH = "dump"

def run_mongodump():
    print("Running mongodump...")
    subprocess.run([
        "mongodump",
        f"--uri={SOURCE_URI}",
        f"--out={DUMP_PATH}"
    ], check=True)
    print("mongodump completed.")

def run_mongorestore():
    print("Running mongorestore...")
    subprocess.run([
        "mongorestore",
        f"--uri={TARGET_URI}",
        "--drop",  # drops existing collections before restoring
        f"{DUMP_PATH}/source_db"  # folder containing dumped collections
    ], check=True)
    print("mongorestore completed.")

def sync_mongodb():
    run_mongodump()
    run_mongorestore()

if __name__ == "__main__":
    sync_mongodb()



from dotenv import load_dotenv
load_dotenv()

SOURCE_URI = os.getenv("SOURCE_MONGO_URI")
TARGET_URI = os.getenv("TARGET_MONGO_URI")

try:
    sync_mongodb()
except subprocess.CalledProcessError as e:
    print(f"Error occurred: {e}")
