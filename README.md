♦ Back-End: Python (reference 'backend/requirement.txt' for virtual environment dependencies)

**After using 'pip install requirement.txt' you must install poppler, for the pdf2image module to work properly in Windows:**
[**https://github.com/oschwartz10612/poppler-windows**](https://github.com/oschwartz10612/poppler-windows)


-   **Then Extract the downloaded files:**

-   **Unzip the downloaded archive to a location on your system, for example, C:\Program Files\Poppler.**

-   **Add Poppler to your system's PATH:**

-   **Locate the bin directory within the extracted Poppler folder (e.g., C:\Program Files\Poppler\poppler-X.Y.Z\bin, where X.Y.Z is the version number).**

-   **Copy the full path to this bin directory.**

-   **Open the System Properties by searching for "Environment Variables" in the Windows search bar and selecting "Edit the system environment variables."**

-   **Click on "Environment Variables."**

-   **Under "System variables," find and select the "Path" variable, then click "Edit."**

-   **Click "New" and paste the path to the Poppler bin directory.**

-   **Click "OK" on all open windows to save the changes.**

-   **Verify the installation:**

-   **Open a new Command Prompt or PowerShell window.**

-   **Type pdftoppm -h and press Enter.**

For more info:[**https://www.geeksforgeeks.org/python/convert-pdf-to-image-using-python/#**](https://www.geeksforgeeks.org/python/convert-pdf-to-image-using-python/)


♦ Front-End: React Native -> Node.Js (Through Chocolatey) and Expo Library + NPM (package manager for Node.js)
A list of all packages for the front-end can me shown using the command 'npm list'


**Dataset Utilized to Train the Diabetes Prediction Model:**
[**https://www.kaggle.com/datasets/simaanjali/diabetes-classification-dataset**](https://www.kaggle.com/datasets/simaanjali/diabetes-classification-dataset/)



**BIOMARKER CONTEXT USED FOR DETERMINING RELEVANT INPUT FIELDS**

**Red Cell Distribution Width (RDW)**

The RDW measures the variation in the size of your red blood cells. A consistently elevated RDW is a significant marker for increased risk of cardiovascular and metabolic diseases, even in the absence of other symptoms. 

-   **Cardiovascular Disease (CVD):** Higher RDW is associated with increased risk and worse prognosis for heart failure, stroke, and arterial stiffness. This is thought to be because RDW reflects various upstream problems, such as chronic inflammation, oxidative stress, and impaired iron mobilization, which contribute to heart disease.
-   **Metabolic Disorders:** Elevated RDW is linked to a higher incidence of type 2 diabetes and metabolic syndrome. 

**Mean Corpuscular Volume (MCV)**

The MCV measures the average size of your red blood cells.

-   **Cardiovascular Disease:** Elevated MCV, even within the high-normal range, has been associated with increased arterial stiffness, a known risk factor for cardiovascular events.
-   **Liver Disease:** High MCV can indicate liver disease, which impairs the body's metabolism and can lead to other complications.
-   **Anemia and Malnutrition:** Low MCV often signals iron deficiency, while high MCV can indicate vitamin B12 or folate deficiency. Persistent, untreated deficiencies can have long-term effects on nerve function, energy, and overall health. 

**Hemoglobin (Hgb)**

Hemoglobin is the protein in red blood cells that carries oxygen. Low levels of hemoglobin indicate anemia.

-   **Cardiovascular Health:** Chronic anemia strains the heart as it works harder to pump sufficient oxygenated blood to the body, which can contribute to long-term heart problems.
-   **Kidney Disease:** Anemia can be an early sign of chronic kidney disease, as the kidneys produce a hormone called erythropoietin, which stimulates red blood cell production. 

**White Blood Cell (WBC) Count**

WBC count is a broad indicator of the body's immune system activity.

-   **CVD and Cancer:** Elevated WBC count is a strong and independent predictor of coronary heart disease and cancer mortality. Chronic inflammation, as indicated by a persistently high WBC count, is a key driver of both conditions.
-   **Immune Dysfunction:** A consistently low WBC count (leukopenia) signals a compromised immune system, increasing susceptibility to severe infections. 

**White Blood Cell Differential (Neutrophils, Lymphocytes, Monocytes)**

The WBC differential provides a breakdown of different types of immune cells, offering more specific insights.

-   **Neutrophils:** Chronic high levels (neutrophilia) can be a sign of systemic inflammation or myeloproliferative disorders, potentially increasing the risk of blood clots.
-   **Lymphocytes:** Low lymphocyte count (lymphopenia) can indicate reduced immune surveillance, increasing the risk of infections, cancer, and mortality from various diseases.
-   **Monocytes:** High monocyte counts (monocytosis) are associated with chronic inflammatory diseases, certain cancers, and cardiovascular risk, particularly in patients with chronic kidney disease. 

**Platelet Count**

Platelets are tiny cell fragments involved in blood clotting.

-   **Cardiovascular Disease:** Elevated platelet counts, even within the normal range, have been linked to increased arterial stiffness, which is a key risk factor for heart attack and stroke.
-   **Metabolic Disease:** Platelets can be overproduced in people with diabetes, potentially leading to a higher risk of abnormal clotting and inflammation.


**REFERENCE RANGES USED**
[**https://www.accp.com/docs/sap/Lab_Values_Table_PSAP.pdf**](https://www.accp.com/docs/sap/Lab_Values_Table_PSAP.pdf)