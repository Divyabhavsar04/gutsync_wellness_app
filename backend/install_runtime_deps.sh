echo "Installing heavy ML dependencies at runtime..."

pip install --no-cache-dir numpy==1.26.4
pip install --no-cache-dir pandas==2.1.4
pip install --no-cache-dir joblib==1.3.2
pip install --no-cache-dir scikit-learn==1.6.1

echo "Done installing ML dependencies!"
