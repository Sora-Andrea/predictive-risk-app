import pytesseract
from PIL import Image

img = Image.open(r"C:\Users\Sora Andrea\predictive-risk-app\frontend\assets\images\lab_report_sample.png")
text = pytesseract.image_to_string(img, lang="eng")
print(text)