import requests
import os

MODEL_DIR = "models"
os.makedirs(MODEL_DIR, exist_ok=True)

files = {
    "preprocessor.joblib": "https://huggingface.co/Divyab2004/gutsync-ml-models/resolve/main/preprocessor.joblib",
    "stress_model.joblib": "https://huggingface.co/Divyab2004/gutsync-ml-models/resolve/main/stress_model.joblib",
    "hormones_model.joblib": "https://huggingface.co/Divyab2004/gutsync-ml-models/resolve/main/hormones_model.joblib",
    "wellness_model.joblib": "https://huggingface.co/Divyab2004/gutsync-ml-models/resolve/main/wellness_model.joblib",
}

for filename, url in files.items():
    print(f"Downloading {filename} ...")
    r = requests.get(url)
    with open(f"{MODEL_DIR}/{filename}", "wb") as f:
        f.write(r.content)


print("✅ All models downloaded successfully.")
