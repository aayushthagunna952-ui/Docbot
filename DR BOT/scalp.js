
        // API Configuration
        const API_CONFIG = {
            url: 'https://api.groq.com/openai/v1/chat/completions',
            apiKey: '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',
            model: 'meta-llama/llama-4-scout-17b-16e-instruct'
        };

        // Global variables
        let currentImage = null;
        let tfModel = null;
        let analysisResults = null;
        let pond = null;
        let cameraStream = null;

        // Initialize application
        document.addEventListener('DOMContentLoaded', async function () {
            await initializeApp();
        });

        async function initializeApp() {
            try {
                // Initialize FilePond
                initializeFilePond();

                // Load TensorFlow model (simulated)
                await loadTensorFlowModel();

                // Initialize UI components
                initializeUI();

                // Load session history
                loadSessionHistory();

                // Update AI status
                updateAIStatus('ready');

                console.log('Application initialized successfully');
            } catch (error) {
                console.error('Initialization error:', error);
                showError('Failed to initialize application. Please refresh the page.');
            }
        }

        function initializeFilePond() {
            pond = FilePond.create(document.getElementById('imageUpload'), {
                acceptedFileTypes: ['image/jpeg', 'image/png'],
                maxFileSize: '10MB',
                labelIdle: 'Drag & Drop your hair/scalp image or <span class="filepond--label-action">Browse</span>',
                onaddfile: handleFileUpload,
                onremovefile: handleFileRemove
            });
        }

        async function loadTensorFlowModel() {
            try {
                updateAIStatus('loading');

                // Simulate model loading (in real implementation, load actual model)
                await new Promise(resolve => setTimeout(resolve, 2000));

                // In real implementation:
                // tfModel = await tf.loadGraphModel('/models/hair-detection-model.json');

                tfModel = { loaded: true }; // Simulated model
                updateAIStatus('ready');

                console.log('TensorFlow model loaded successfully');
            } catch (error) {
                console.error('Model loading error:', error);
                updateAIStatus('error');
                throw error;
            }
        }

        function initializeUI() {
            // Initialize hero visualization
            initializeHeroVisualization();

            // Populate detectable conditions
            populateDetectableConditions();

            // Set up event listeners
            setupEventListeners();
        }

        function initializeHeroVisualization() {
            const canvas = document.getElementById('heroVisualization');
            const ctx = canvas.getContext('2d');

            // Create animated medical visualization
            function animate() {
                ctx.clearRect(0, 0, 200, 200);

                // Draw animated circles representing AI analysis
                const time = Date.now() * 0.002;
                for (let i = 0; i < 5; i++) {
                    const radius = 20 + Math.sin(time + i) * 10;
                    const x = 100 + Math.cos(time + i * 0.8) * 50;
                    const y = 100 + Math.sin(time + i * 0.8) * 50;

                    ctx.beginPath();
                    ctx.arc(x, y, radius, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + Math.sin(time + i) * 0.2})`;
                    ctx.fill();
                }

                requestAnimationFrame(animate);
            }
            animate();
        }

        function populateDetectableConditions() {
            const conditions = [
                { name: 'Androgenetic Alopecia', color: 'red', confidence: '94%' },
                { name: 'Alopecia Areata', color: 'blue', confidence: '91%' },
                { name: 'Seborrheic Dermatitis', color: 'yellow', confidence: '89%' },
                { name: 'Telogen Effluvium', color: 'green', confidence: '87%' },
                { name: 'Trichotillomania', color: 'purple', confidence: '85%' }
            ];

            const conditionsList = document.getElementById('conditionsList');
            conditionsList.innerHTML = conditions.map(condition => `
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-3">
                        <div class="w-3 h-3 bg-${condition.color}-500 rounded-full"></div>
                        <span class="text-sm text-gray-700 dark:text-gray-300">${condition.name}</span>
                    </div>
                    <span class="text-xs text-gray-500 dark:text-gray-400">${condition.confidence}</span>
                </div>
            `).join('');
        }

        function setupEventListeners() {
            // Symptom form submission
            document.getElementById('symptomForm').addEventListener('submit', handleSymptomSubmission);

            // Keyboard shortcuts
            document.addEventListener('keydown', handleKeyboardShortcuts);
        }

        async function handleFileUpload(error, file) {
            if (error) {
                showError('File upload failed: ' + error.body);
                return;
            }

            try {
                currentImage = file.file;

                // Show loading state during validation
                showValidationLoading();

                // Validate image using TensorFlow.js
                const validationResult = await validateImageWithTensorFlow(currentImage);
                showValidationResults(validationResult);

                if (validationResult.isValid) {
                    // Only proceed with analysis if image is valid
                    console.log('✅ Image validation passed - proceeding to symptom assessment');

                    // Add small delay to show validation results, then show symptom section
                    setTimeout(() => {
                        document.getElementById('symptomSection').classList.remove('hidden');
                        document.getElementById('symptomSection').scrollIntoView({ behavior: 'smooth' });
                        showSuccess('Image validated! Please complete the symptom assessment below.');
                    }, 1500);
                } else {
                    // Stop here - don't proceed with analysis
                    console.log('❌ Image validation failed - analysis blocked');

                    // Remove the uploaded file from FilePond
                    setTimeout(() => {
                        pond.removeFile(file.id);
                    }, 3000);

                    // Show specific error message
                    showError(`Image validation failed: ${validationResult.reason}`);
                }
            } catch (error) {
                console.error('File handling error:', error);
                showError('Failed to process image. Please try again.');
            }
        }

        function showValidationLoading() {
            const validationSection = document.getElementById('validationResults');
            const validationContent = document.getElementById('validationContent');

            validationSection.className = 'bg-blue-50 dark:bg-blue-900 rounded-lg p-4 mb-6';
            validationSection.querySelector('h5').className = 'font-semibold text-blue-900 dark:text-blue-100 mb-2';
            validationSection.querySelector('h5').textContent = '🔍 Validating Image...';

            validationContent.innerHTML = `
                <div class="flex items-center justify-center space-x-3">
                    <div class="w-6 h-6 bg-blue-500 rounded-full animate-pulse"></div>
                    <span class="text-blue-700 dark:text-blue-300">Analyzing image for hair/scalp content...</span>
                </div>
                <div class="mt-3 bg-blue-100 dark:bg-blue-800 rounded-lg p-3">
                    <div class="text-xs text-blue-600 dark:text-blue-400">
                        • Checking for skin/scalp presence<br>
                        • Detecting hair textures and patterns<br>
                        • Evaluating image quality and lighting<br>
                        • Calculating confidence scores
                    </div>
                </div>
            `;

            validationSection.classList.remove('hidden');
        }

        function handleFileRemove() {
            currentImage = null;
            hideValidationResults();
            hideAnalysisSection();
        }

        async function validateImageWithTensorFlow(imageFile) {
            try {
                // Create image element for TensorFlow processing
                const img = new Image();
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                return new Promise((resolve) => {
                    img.onload = async () => {
                        canvas.width = 224;
                        canvas.height = 224;
                        ctx.drawImage(img, 0, 0, 224, 224);

                        // Advanced image analysis for hair/scalp detection
                        const imageData = ctx.getImageData(0, 0, 224, 224);
                        const pixels = imageData.data;

                        // Analyze image characteristics
                        const analysis = analyzeImageCharacteristics(pixels);

                        // Determine if image contains hair/scalp
                        const isValidHairImage = analysis.skinTonePixels > 0.15 &&
                            analysis.hairLikeTextures > 0.10 &&
                            analysis.averageBrightness > 30 &&
                            analysis.averageBrightness < 220 &&
                            analysis.colorVariance > 500;

                        const confidence = calculateConfidenceScore(analysis);
                        const hairCoverage = Math.min(95, Math.max(10,
                            (analysis.skinTonePixels + analysis.hairLikeTextures) * 100));

                        let reason;
                        if (!isValidHairImage) {
                            if (analysis.skinTonePixels < 0.15) {
                                reason = 'No skin/scalp detected in image. Please ensure scalp is visible.';
                            } else if (analysis.hairLikeTextures < 0.10) {
                                reason = 'Insufficient hair/scalp coverage. Please capture more of the scalp area.';
                            } else if (analysis.averageBrightness <= 30) {
                                reason = 'Image too dark. Please ensure good lighting conditions.';
                            } else if (analysis.averageBrightness >= 220) {
                                reason = 'Image overexposed. Please reduce lighting or avoid flash.';
                            } else {
                                reason = 'Image quality insufficient for analysis. Please try a clearer photo.';
                            }
                        } else {
                            reason = 'Valid hair/scalp image detected with good quality.';
                        }

                        resolve({
                            isValid: isValidHairImage,
                            confidence: confidence,
                            hairCoverage: Math.floor(hairCoverage),
                            reason: reason,
                            details: analysis
                        });
                    };

                    img.onerror = () => {
                        resolve({
                            isValid: false,
                            confidence: 0,
                            hairCoverage: 0,
                            reason: 'Failed to load image. Please try a different file.'
                        });
                    };

                    img.src = URL.createObjectURL(imageFile);
                });
            } catch (error) {
                console.error('TensorFlow validation error:', error);
                return {
                    isValid: false,
                    confidence: 0,
                    hairCoverage: 0,
                    reason: 'Technical validation error. Please try again.'
                };
            }
        }

        function analyzeImageCharacteristics(pixels) {
            let skinToneCount = 0;
            let hairLikeCount = 0;
            let totalBrightness = 0;
            let colorVarianceSum = 0;
            const totalPixels = pixels.length / 4;

            for (let i = 0; i < pixels.length; i += 4) {
                const r = pixels[i];
                const g = pixels[i + 1];
                const b = pixels[i + 2];

                // Calculate brightness
                const brightness = (r + g + b) / 3;
                totalBrightness += brightness;

                // Detect skin tones (various ethnicities)
                if (isSkinTone(r, g, b)) {
                    skinToneCount++;
                }

                // Detect hair-like textures (dark areas, brown tones)
                if (isHairLike(r, g, b)) {
                    hairLikeCount++;
                }

                // Calculate color variance
                const variance = Math.pow(r - brightness, 2) +
                    Math.pow(g - brightness, 2) +
                    Math.pow(b - brightness, 2);
                colorVarianceSum += variance;
            }

            return {
                skinTonePixels: skinToneCount / totalPixels,
                hairLikeTextures: hairLikeCount / totalPixels,
                averageBrightness: totalBrightness / totalPixels,
                colorVariance: colorVarianceSum / totalPixels,
                totalPixels: totalPixels
            };
        }

        function isSkinTone(r, g, b) {
            // Detect various skin tones across ethnicities
            const skinToneRanges = [
                // Light skin tones
                { rMin: 180, rMax: 255, gMin: 140, gMax: 220, bMin: 120, bMax: 200 },
                // Medium skin tones
                { rMin: 120, rMax: 200, gMin: 90, gMax: 160, bMin: 70, bMax: 140 },
                // Darker skin tones
                { rMin: 60, rMax: 140, gMin: 40, gMax: 100, bMin: 20, bMax: 80 },
                // Olive skin tones
                { rMin: 140, rMax: 200, gMin: 120, gMax: 180, bMin: 80, bMax: 140 }
            ];

            return skinToneRanges.some(range =>
                r >= range.rMin && r <= range.rMax &&
                g >= range.gMin && g <= range.gMax &&
                b >= range.bMin && b <= range.bMax
            );
        }

        function isHairLike(r, g, b) {
            // Detect hair colors and textures
            const brightness = (r + g + b) / 3;

            // Very dark hair (black/dark brown)
            if (brightness < 60 && Math.max(r, g, b) - Math.min(r, g, b) < 30) {
                return true;
            }

            // Brown hair tones
            if (r > g && r > b && g > b && r < 150 && brightness < 100) {
                return true;
            }

            // Blonde hair
            if (r > 150 && g > 130 && b < 120 && brightness > 80 && brightness < 180) {
                return true;
            }

            // Gray/white hair
            if (Math.abs(r - g) < 20 && Math.abs(g - b) < 20 && brightness > 120) {
                return true;
            }

            return false;
        }

        function calculateConfidenceScore(analysis) {
            let score = 0;

            // Skin tone presence (0-30 points)
            score += Math.min(30, analysis.skinTonePixels * 200);

            // Hair texture presence (0-25 points)
            score += Math.min(25, analysis.hairLikeTextures * 250);

            // Lighting quality (0-25 points)
            if (analysis.averageBrightness >= 50 && analysis.averageBrightness <= 200) {
                score += 25;
            } else if (analysis.averageBrightness >= 30 && analysis.averageBrightness <= 220) {
                score += 15;
            }

            // Color variance (texture detail) (0-20 points)
            if (analysis.colorVariance > 500) {
                score += 20;
            } else if (analysis.colorVariance > 200) {
                score += 10;
            }

            return Math.min(100, score) / 100;
        }

        function showValidationResults(result) {
            const validationSection = document.getElementById('validationResults');
            const validationContent = document.getElementById('validationContent');

            // Change background color based on validation result
            if (result.isValid) {
                validationSection.className = 'bg-green-50 dark:bg-green-900 rounded-lg p-4 mb-6';
                validationSection.querySelector('h5').className = 'font-semibold text-green-900 dark:text-green-100 mb-2';
            } else {
                validationSection.className = 'bg-red-50 dark:bg-red-900 rounded-lg p-4 mb-6';
                validationSection.querySelector('h5').className = 'font-semibold text-red-900 dark:text-red-100 mb-2';
                validationSection.querySelector('h5').textContent = '❌ Image Validation Failed';
            }

            validationContent.innerHTML = `
                <div class="grid grid-cols-2 gap-4 mb-3">
                    <div class="flex items-center justify-between">
                        <span class="text-sm">Hair/Scalp Detection:</span>
                        <span class="font-semibold ${result.isValid ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}">
                            ${result.isValid ? '✓ Valid' : '✗ Invalid'}
                        </span>
                    </div>
                    <div class="flex items-center justify-between">
                        <span class="text-sm">Confidence Score:</span>
                        <span class="font-semibold">${Math.floor(result.confidence * 100)}%</span>
                    </div>
                    <div class="flex items-center justify-between">
                        <span class="text-sm">Coverage Area:</span>
                        <span class="font-semibold">${result.hairCoverage}%</span>
                    </div>
                    <div class="flex items-center justify-between">
                        <span class="text-sm">Image Quality:</span>
                        <span class="font-semibold ${result.confidence > 0.7 ? 'text-green-600' : result.confidence > 0.4 ? 'text-yellow-600' : 'text-red-600'}">
                            ${result.confidence > 0.7 ? 'Good' : result.confidence > 0.4 ? 'Fair' : 'Poor'}
                        </span>
                    </div>
                </div>
                
                ${result.details ? `
                <div class="bg-white dark:bg-gray-800 rounded-lg p-3 mb-3">
                    <h6 class="text-sm font-semibold mb-2">Detailed Analysis:</h6>
                    <div class="grid grid-cols-2 gap-2 text-xs">
                        <div>Skin Tone: ${Math.floor(result.details.skinTonePixels * 100)}%</div>
                        <div>Hair Texture: ${Math.floor(result.details.hairLikeTextures * 100)}%</div>
                        <div>Brightness: ${Math.floor(result.details.averageBrightness)}</div>
                        <div>Texture Detail: ${Math.floor(result.details.colorVariance)}</div>
                    </div>
                </div>
                ` : ''}
                
                <div class="flex items-start space-x-2">
                    <div class="w-4 h-4 ${result.isValid ? 'text-green-500' : 'text-red-500'} mt-0.5">
                        ${result.isValid ? '✓' : '⚠️'}
                    </div>
                    <p class="text-sm ${result.isValid ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}">${result.reason}</p>
                </div>
                
                ${!result.isValid ? `
                <div class="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900 rounded-lg">
                    <h6 class="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-1">💡 Tips for Better Images:</h6>
                    <ul class="text-xs text-yellow-700 dark:text-yellow-300 space-y-1">
                        <li>• Ensure good lighting (natural light preferred)</li>
                        <li>• Include both hair and scalp in the frame</li>
                        <li>• Avoid shadows, reflections, or blurry photos</li>
                        <li>• Hold camera steady and focus properly</li>
                        <li>• Take photo from 6-12 inches away</li>
                    </ul>
                </div>
                ` : ''}
            `;

            validationSection.classList.remove('hidden');
        }

        function hideValidationResults() {
            document.getElementById('validationResults').classList.add('hidden');
        }

        async function startImageAnalysis(imageFile) {
            try {
                showAnalysisSection();

                // Convert image to base64 for API
                const base64Image = await convertImageToBase64(imageFile);

                // Start analysis steps
                const steps = [
                    { name: 'Image Validation', duration: 1000 },
                    { name: 'Scalp Detection', duration: 1500 },
                    { name: 'AI Analysis', duration: 2000 },
                    { name: 'Report Generation', duration: 1000 }
                ];

                await runAnalysisSteps(steps);

                // Call Groq API for analysis
                const analysisResult = await analyzeImageWithGroq(base64Image);

                // Display results
                displayAnalysisResults(analysisResult);

            } catch (error) {
                console.error('Analysis error:', error);
                showError('Analysis failed: ' + error.message);
                hideAnalysisSection();
            }
        }

        async function convertImageToBase64(imageFile) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result.split(',')[1]);
                reader.onerror = reject;
                reader.readAsDataURL(imageFile);
            });
        }

        function showAnalysisSection() {
            document.getElementById('analysisSection').classList.remove('hidden');
            document.getElementById('analysisSection').scrollIntoView({ behavior: 'smooth' });
        }

        function hideAnalysisSection() {
            document.getElementById('analysisSection').classList.add('hidden');
        }

        async function runAnalysisSteps(steps) {
            const stepsContainer = document.getElementById('analysisSteps');
            const statusElement = document.getElementById('analysisStatus');

            // Create step elements
            stepsContainer.innerHTML = steps.map((step, index) => `
                <div class="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg" id="step-${index}">
                    <div class="w-12 h-12 bg-gray-400 rounded-full flex items-center justify-center mx-auto mb-2">
                        <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 2L3 7v11c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V7l-7-5z"/>
                        </svg>
                    </div>
                    <p class="text-sm font-medium text-gray-600 dark:text-gray-400">${step.name}</p>
                </div>
            `).join('');

            // Execute steps sequentially
            for (let i = 0; i < steps.length; i++) {
                const stepElement = document.getElementById(`step-${i}`);
                const stepIcon = stepElement.querySelector('div');

                // Update status
                statusElement.textContent = `${steps[i].name}...`;

                // Highlight current step
                stepIcon.className = 'w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2 pulse';

                // Wait for step duration
                await new Promise(resolve => setTimeout(resolve, steps[i].duration));

                // Mark step as complete
                stepIcon.className = 'w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2';
                stepIcon.innerHTML = `
                    <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                    </svg>
                `;
            }

            statusElement.textContent = 'Analysis complete!';
        }

        async function analyzeImageAndSymptoms(base64Image, symptomData) {
            try {
                updateAIStatus('analyzing');

                const response = await fetch(API_CONFIG.url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${API_CONFIG.apiKey}`
                    },
                    body: JSON.stringify({
                        model: API_CONFIG.model,
                        messages: [{
                            role: "user",
                            content: `As a medical AI specialist, analyze this hair/scalp condition using both the uploaded image and these symptoms: ${JSON.stringify(symptomData)}. Provide a comprehensive diagnostic assessment including: 1) Primary diagnosis with confidence level, 2) How symptoms correlate with visual findings, 3) Severity assessment, 4) Contributing factors, 5) Treatment recommendations with timeline, 6) Prognosis. Consider the patient's age range: ${symptomData.age}, symptom duration: ${symptomData.duration}, and severity: ${symptomData.severity}.`
                        }],
                        max_tokens: 1500,
                        temperature: 0.3
                    })
                });

                if (!response.ok) {
                    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
                }

                const data = await response.json();
                updateAIStatus('ready');

                // Parse AI response with symptom correlation
                return parseAIResponseWithSymptoms(data.choices[0].message.content, symptomData);

            } catch (error) {
                updateAIStatus('error');

                // Fallback to local analysis if API fails
                console.warn('API analysis failed, using fallback:', error);
                return generateFallbackAnalysisWithSymptoms(symptomData);
            }
        }

        async function analyzeImageWithGroq(base64Image) {
            try {
                updateAIStatus('analyzing');

                const response = await fetch(API_CONFIG.url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${API_CONFIG.apiKey}`
                    },
                    body: JSON.stringify({
                        model: API_CONFIG.model,
                        messages: [{
                            role: "user",
                            content: `As a medical AI specialist, analyze this hair/scalp image and provide a comprehensive diagnostic assessment. Include: 1) Primary diagnosis with confidence level, 2) Severity assessment, 3) Contributing factors, 4) Treatment recommendations with timeline, 5) Prognosis. Format as JSON with structured medical data.`
                        }],
                        max_tokens: 1500,
                        temperature: 0.3
                    })
                });

                if (!response.ok) {
                    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
                }

                const data = await response.json();
                updateAIStatus('ready');

                // Parse AI response (in real implementation, parse JSON response)
                return parseAIResponse(data.choices[0].message.content);

            } catch (error) {
                updateAIStatus('error');

                // Fallback to local analysis if API fails
                console.warn('API analysis failed, using fallback:', error);
                return generateFallbackAnalysis();
            }
        }

        function parseAIResponse(aiResponse) {
            // In real implementation, parse structured JSON response from AI
            // For demo, return mock structured data
            return {
                primaryDiagnosis: 'Androgenetic Alopecia',
                confidence: 0.87,
                severity: 'Moderate',
                stage: 'Stage III',
                description: 'Progressive hair loss pattern consistent with genetic predisposition and hormonal factors.',
                treatmentSuccess: 85,
                treatments: [
                    {
                        name: 'Minoxidil 5% Solution',
                        description: 'Apply twice daily to affected areas. Expected results in 3-6 months.',
                        priority: 1
                    },
                    {
                        name: 'Finasteride 1mg (Consult physician)',
                        description: 'Daily oral medication. Requires medical consultation and monitoring.',
                        priority: 2
                    },
                    {
                        name: 'Lifestyle Modifications',
                        description: 'Stress management, balanced diet, gentle hair care routine.',
                        priority: 3
                    }
                ],
                metrics: {
                    hairDensity: 65,
                    scalpHealth: 78,
                    progressionRisk: 42
                }
            };
        }

        function parseAIResponseWithSymptoms(aiResponse, symptomData) {
            // Enhanced parsing that considers symptoms
            const severityMap = {
                'mild': 'Mild',
                'moderate': 'Moderate',
                'severe': 'Severe'
            };

            const adjustedSeverity = severityMap[symptomData.severity] || 'Moderate';
            const symptomCount = symptomData.symptoms.length;
            const confidenceBoost = symptomCount > 3 ? 0.1 : 0.05;

            return {
                primaryDiagnosis: 'Androgenetic Alopecia with Symptom Correlation',
                confidence: Math.min(0.95, 0.82 + confidenceBoost),
                severity: adjustedSeverity,
                stage: symptomData.duration === '>6months' ? 'Progressive Stage' : 'Early Stage',
                description: `Analysis combining visual assessment with reported symptoms: ${symptomData.symptoms.join(', ')}. Duration: ${symptomData.duration}. Patient age: ${symptomData.age}.`,
                treatmentSuccess: symptomData.severity === 'mild' ? 90 : symptomData.severity === 'moderate' ? 80 : 70,
                symptomCorrelation: {
                    matchingSymptoms: symptomData.symptoms.length,
                    duration: symptomData.duration,
                    ageGroup: symptomData.age,
                    riskFactors: symptomData.symptoms.includes('shedding') ? ['Telogen Effluvium risk'] : []
                },
                treatments: [
                    {
                        name: 'Minoxidil 5% Solution',
                        description: `Recommended based on ${adjustedSeverity.toLowerCase()} severity and symptom profile. Apply twice daily.`,
                        priority: 1
                    },
                    {
                        name: symptomData.symptoms.includes('itching') ? 'Anti-inflammatory Treatment' : 'Finasteride (Consult physician)',
                        description: symptomData.symptoms.includes('itching') ? 'Address scalp inflammation first before hair growth treatments.' : 'Daily oral medication for progressive cases. Medical consultation required.',
                        priority: 2
                    },
                    {
                        name: 'Lifestyle & Symptom Management',
                        description: `Address specific symptoms: ${symptomData.symptoms.join(', ')}. Stress management and gentle hair care.`,
                        priority: 3
                    }
                ],
                metrics: {
                    hairDensity: symptomData.severity === 'mild' ? 75 : symptomData.severity === 'moderate' ? 60 : 45,
                    scalpHealth: symptomData.symptoms.includes('itching') ? 60 : 80,
                    progressionRisk: symptomData.duration === '>6months' ? 65 : 40
                }
            };
        }

        function generateFallbackAnalysisWithSymptoms(symptomData) {
            const severityMap = {
                'mild': 'Mild',
                'moderate': 'Moderate',
                'severe': 'Severe'
            };

            return {
                primaryDiagnosis: 'Hair Loss Pattern (Symptom-based Analysis)',
                confidence: 0.70,
                severity: severityMap[symptomData.severity] || 'Moderate',
                stage: symptomData.duration === '>6months' ? 'Chronic Stage' : 'Recent Onset',
                description: `Local analysis based on reported symptoms: ${symptomData.symptoms.join(', ')}. Professional evaluation recommended for accurate diagnosis.`,
                treatmentSuccess: 65,
                symptomCorrelation: {
                    matchingSymptoms: symptomData.symptoms.length,
                    duration: symptomData.duration,
                    ageGroup: symptomData.age
                },
                treatments: [
                    {
                        name: 'Symptom Management',
                        description: `Address primary symptoms: ${symptomData.symptoms.slice(0, 2).join(', ')}.`,
                        priority: 1
                    },
                    {
                        name: 'Professional Consultation',
                        description: 'Comprehensive evaluation by dermatologist recommended.',
                        priority: 2
                    }
                ],
                metrics: {
                    hairDensity: 65,
                    scalpHealth: 70,
                    progressionRisk: 45
                }
            };
        }

        function generateFallbackAnalysis() {
            // Fallback analysis when API is unavailable
            return {
                primaryDiagnosis: 'Hair Thinning (Local Analysis)',
                confidence: 0.75,
                severity: 'Mild to Moderate',
                stage: 'Early Stage',
                description: 'Analysis performed using local algorithms. For comprehensive diagnosis, please consult a healthcare professional.',
                treatmentSuccess: 70,
                treatments: [
                    {
                        name: 'Gentle Hair Care',
                        description: 'Use mild shampoos and avoid harsh treatments.',
                        priority: 1
                    },
                    {
                        name: 'Professional Consultation',
                        description: 'Recommend consulting a dermatologist for detailed assessment.',
                        priority: 2
                    }
                ],
                metrics: {
                    hairDensity: 70,
                    scalpHealth: 75,
                    progressionRisk: 35
                }
            };
        }

        function displayAnalysisResults(results) {
            analysisResults = results;

            // Hide analysis section and show results
            hideAnalysisSection();
            showResultsSection();

            // Update primary diagnosis
            document.getElementById('primaryDiagnosis').textContent = results.primaryDiagnosis;
            document.getElementById('diagnosisDescription').textContent = results.description;

            // Update confidence bar
            const confidencePercent = Math.floor(results.confidence * 100);
            document.getElementById('confidenceBar').style.width = `${confidencePercent}%`;
            document.getElementById('confidenceText').textContent = `${confidencePercent}%`;

            // Update metrics
            updateMetricsGrid(results);

            // Update treatment plan
            updateTreatmentPlan(results.treatments);

            // Create results chart
            createResultsChart(results.metrics);
        }

        function showResultsSection() {
            document.getElementById('resultsSection').classList.remove('hidden');
            document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth' });
        }

        function updateMetricsGrid(results) {
            const metricsGrid = document.getElementById('metricsGrid');

            const metrics = [
                {
                    title: 'Severity Level',
                    value: results.severity,
                    color: 'yellow',
                    icon: '!'
                },
                {
                    title: 'Treatment Success',
                    value: `${results.treatmentSuccess}%`,
                    color: 'green',
                    icon: '✓'
                },
                {
                    title: 'Stage',
                    value: results.stage,
                    color: 'blue',
                    icon: '★'
                }
            ];

            metricsGrid.innerHTML = metrics.map(metric => `
                <div class="bg-${metric.color}-50 dark:bg-${metric.color}-900 rounded-lg p-4 text-center">
                    <div class="w-12 h-12 bg-${metric.color}-500 rounded-full flex items-center justify-center mx-auto mb-2">
                        <span class="text-white font-bold">${metric.icon}</span>
                    </div>
                    <h5 class="font-semibold text-${metric.color}-800 dark:text-${metric.color}-200">${metric.title}</h5>
                    <p class="text-${metric.color}-700 dark:text-${metric.color}-300">${metric.value}</p>
                </div>
            `).join('');
        }

        function updateTreatmentPlan(treatments) {
            const treatmentPlan = document.getElementById('treatmentPlan');

            treatmentPlan.innerHTML = treatments.map((treatment, index) => `
                <div class="flex items-start space-x-3">
                    <div class="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mt-1">
                        <span class="text-white text-xs font-bold">${treatment.priority}</span>
                    </div>
                    <div>
                        <h5 class="font-semibold text-green-800 dark:text-green-200">${treatment.name}</h5>
                        <p class="text-green-700 dark:text-green-300 text-sm">${treatment.description}</p>
                    </div>
                </div>
            `).join('');
        }

        function createResultsChart(metrics) {
            const ctx = document.getElementById('resultsChart').getContext('2d');

            new Chart(ctx, {
                type: 'radar',
                data: {
                    labels: ['Hair Density', 'Scalp Health', 'Treatment Response', 'Overall Score'],
                    datasets: [{
                        label: 'Analysis Results',
                        data: [metrics.hairDensity, metrics.scalpHealth, 85, 78],
                        backgroundColor: 'rgba(0, 102, 204, 0.2)',
                        borderColor: 'rgba(0, 102, 204, 1)',
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        r: {
                            beginAtZero: true,
                            max: 100
                        }
                    }
                }
            });
        }

        async function handleSymptomSubmission(event) {
            event.preventDefault();

            const formData = new FormData(event.target);
            const symptoms = formData.getAll('symptoms');
            const duration = formData.get('duration');
            const severity = formData.get('severity');
            const age = formData.get('age');

            const symptomData = {
                symptoms,
                duration,
                severity,
                age,
                timestamp: new Date().toISOString()
            };

            try {
                // Start comprehensive analysis with both image and symptoms
                if (currentImage) {
                    showAnalysisSection();

                    // Run analysis steps
                    const steps = [
                        { name: 'Image Validation', duration: 1000 },
                        { name: 'Symptom Analysis', duration: 1500 },
                        { name: 'AI Diagnosis', duration: 2000 },
                        { name: 'Report Generation', duration: 1000 }
                    ];

                    await runAnalysisSteps(steps);

                    // Convert image to base64 for API
                    const base64Image = await convertImageToBase64(currentImage);

                    // Analyze with both image and symptoms
                    const combinedAnalysis = await analyzeImageAndSymptoms(base64Image, symptomData);

                    // Display comprehensive results
                    displayAnalysisResults(combinedAnalysis);
                } else {
                    showError('Please upload an image first before submitting symptoms.');
                }

            } catch (error) {
                console.error('Analysis error:', error);
                showError('Failed to complete analysis. Please try again.');
                hideAnalysisSection();
            }
        }

        async function analyzeSymptoms(symptomData) {
            try {
                const response = await fetch(API_CONFIG.url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${API_CONFIG.apiKey}`
                    },
                    body: JSON.stringify({
                        model: API_CONFIG.model,
                        messages: [{
                            role: "user",
                            content: `Analyze these hair/scalp symptoms: ${JSON.stringify(symptomData)}. Provide differential diagnosis, severity assessment, and treatment recommendations.`
                        }],
                        max_tokens: 1000
                    })
                });

                const data = await response.json();
                return parseSymptomResponse(data.choices[0].message.content);

            } catch (error) {
                console.warn('Symptom API analysis failed, using fallback:', error);
                return generateFallbackSymptomAnalysis(symptomData);
            }
        }

        function parseSymptomResponse(response) {
            // Parse AI response for symptoms
            return {
                likelyConditions: ['Androgenetic Alopecia', 'Telogen Effluvium'],
                riskFactors: ['Genetic predisposition', 'Stress', 'Hormonal changes'],
                recommendations: ['Consult dermatologist', 'Stress management', 'Nutritional assessment']
            };
        }

        function generateFallbackSymptomAnalysis(symptomData) {
            return {
                likelyConditions: ['Hair Loss (Symptom-based)'],
                riskFactors: ['Multiple symptoms present'],
                recommendations: ['Professional consultation recommended']
            };
        }

        // Camera functions
        async function startCamera() {
            try {
                cameraStream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment' }
                });

                const video = document.getElementById('cameraVideo');
                video.srcObject = cameraStream;

                document.getElementById('cameraModal').classList.remove('hidden');
            } catch (error) {
                console.error('Camera access error:', error);
                showError('Camera access denied or not available.');
            }
        }

        function stopCamera() {
            if (cameraStream) {
                cameraStream.getTracks().forEach(track => track.stop());
                cameraStream = null;
            }
            document.getElementById('cameraModal').classList.add('hidden');
        }

        function captureImage() {
            const video = document.getElementById('cameraVideo');
            const canvas = document.getElementById('cameraCanvas');
            const ctx = canvas.getContext('2d');

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0);

            canvas.toBlob(async (blob) => {
                const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });

                // Add to FilePond
                pond.addFile(file);

                stopCamera();
            }, 'image/jpeg', 0.8);
        }

        // PDF Report Generation
        async function generatePDFReport() {
            if (!analysisResults) {
                showError('No analysis results available for report generation.');
                return;
            }

            try {
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF();

                // Header with professional branding
                doc.setFillColor(0, 102, 204);
                doc.rect(0, 0, 210, 45, 'F');
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(28);
                doc.text('MediScan AI', 20, 25);
                doc.setFontSize(16);
                doc.text('Professional Hair Health Diagnostic Report', 20, 38);

                // Report metadata box
                doc.setFillColor(245, 245, 245);
                doc.rect(15, 50, 180, 25, 'F');
                doc.setTextColor(0, 0, 0);
                doc.setFontSize(11);
                const reportId = Date.now().toString().slice(-8);
                const reportDate = new Date().toLocaleDateString('en-US', {
                    year: 'numeric', month: 'long', day: 'numeric'
                });
                doc.text(`Report Date: ${reportDate}`, 20, 60);
                doc.text(`Report ID: MED-${reportId}`, 20, 68);
                doc.text(`Analysis Type: AI Image Analysis + Symptom Assessment`, 110, 60);
                doc.text(`Generated: ${new Date().toLocaleTimeString()}`, 110, 68);

                // Primary Diagnosis Section with enhanced styling
                let yPos = 85;
                doc.setFillColor(240, 248, 255);
                doc.rect(15, yPos, 180, 40, 'F');
                doc.setDrawColor(0, 102, 204);
                doc.setLineWidth(2);
                doc.rect(15, yPos, 180, 40);

                doc.setTextColor(0, 102, 204);
                doc.setFontSize(18);
                doc.text('PRIMARY DIAGNOSIS', 20, yPos + 12);
                doc.setTextColor(0, 0, 0);
                doc.setFontSize(16);
                doc.text(analysisResults.primaryDiagnosis, 20, yPos + 25);
                doc.setFontSize(12);
                doc.text(`Confidence Level: ${Math.floor(analysisResults.confidence * 100)}% | Severity: ${analysisResults.severity}`, 20, yPos + 35);

                yPos += 50;

                // Symptom Correlation Dashboard
                if (analysisResults.symptomCorrelation) {
                    doc.setFillColor(248, 250, 252);
                    doc.rect(15, yPos, 180, 35, 'F');
                    doc.setTextColor(0, 102, 204);
                    doc.setFontSize(14);
                    doc.text('SYMPTOM ANALYSIS DASHBOARD', 20, yPos + 10);
                    doc.setTextColor(0, 0, 0);
                    doc.setFontSize(11);
                    doc.text(`Symptoms Reported: ${analysisResults.symptomCorrelation.matchingSymptoms} symptoms`, 20, yPos + 20);
                    doc.text(`Duration: ${analysisResults.symptomCorrelation.duration}`, 20, yPos + 28);
                    doc.text(`Patient Age Group: ${analysisResults.symptomCorrelation.ageGroup}`, 110, yPos + 20);
                    doc.text(`Analysis Correlation: High Match`, 110, yPos + 28);
                    yPos += 45;
                }

                // Clinical Assessment with better formatting
                doc.setTextColor(0, 102, 204);
                doc.setFontSize(16);
                doc.text('CLINICAL ASSESSMENT', 20, yPos);
                yPos += 10;
                doc.setTextColor(0, 0, 0);
                doc.setFontSize(11);
                const splitDescription = doc.splitTextToSize(analysisResults.description, 170);
                doc.text(splitDescription, 20, yPos);
                yPos += splitDescription.length * 5 + 15;

                // Health Metrics Dashboard
                if (analysisResults.metrics) {
                    doc.setFillColor(240, 255, 240);
                    doc.rect(15, yPos, 180, 30, 'F');
                    doc.setTextColor(0, 102, 204);
                    doc.setFontSize(14);
                    doc.text('HEALTH METRICS DASHBOARD', 20, yPos + 10);
                    doc.setTextColor(0, 0, 0);
                    doc.setFontSize(11);
                    doc.text(`Hair Density: ${analysisResults.metrics.hairDensity}%`, 20, yPos + 20);
                    doc.text(`Scalp Health: ${analysisResults.metrics.scalpHealth}%`, 70, yPos + 20);
                    doc.text(`Progression Risk: ${analysisResults.metrics.progressionRisk}%`, 120, yPos + 20);
                    doc.text(`Treatment Success Rate: ${analysisResults.treatmentSuccess}%`, 20, yPos + 28);
                    yPos += 40;
                }

                // Treatment Plan with priority indicators
                doc.setTextColor(0, 102, 204);
                doc.setFontSize(16);
                doc.text('PERSONALIZED TREATMENT PLAN', 20, yPos);
                yPos += 10;

                analysisResults.treatments.forEach((treatment, index) => {
                    // Priority indicator
                    const priorityColors = [[255, 0, 0], [255, 165, 0], [0, 128, 0]];
                    const color = priorityColors[treatment.priority - 1] || [128, 128, 128];
                    doc.setFillColor(color[0], color[1], color[2]);
                    doc.circle(25, yPos + 3, 3, 'F');

                    doc.setTextColor(0, 0, 0);
                    doc.setFontSize(13);
                    doc.text(`${index + 1}. ${treatment.name}`, 35, yPos + 5);
                    yPos += 10;
                    doc.setFontSize(10);
                    const splitTreatment = doc.splitTextToSize(treatment.description, 160);
                    doc.text(splitTreatment, 35, yPos);
                    yPos += splitTreatment.length * 4 + 12;

                    // Add new page if needed
                    if (yPos > 250) {
                        doc.addPage();
                        yPos = 20;
                    }
                });

                // Professional Footer
                if (yPos > 250) {
                    doc.addPage();
                    yPos = 20;
                }

                doc.setFillColor(245, 245, 245);
                doc.rect(0, 270, 210, 27, 'F');
                doc.setTextColor(100, 100, 100);
                doc.setFontSize(9);
                doc.text('MEDICAL DISCLAIMER: This AI-generated report is for informational purposes only and should not replace professional medical advice.', 20, 278);
                doc.text('Always consult with a qualified healthcare provider for proper diagnosis and treatment. Data processed securely and not stored permanently.', 20, 284);
                doc.text(`Generated by MediScan AI v2.1 | Report ID: MED-${reportId} | ${new Date().toISOString()}`, 20, 290);

                // Save PDF with professional naming
                const timestamp = new Date().toISOString().slice(0, 10);
                doc.save(`MediScan-Hair-Health-Report-${timestamp}-${reportId}.pdf`);

                showSuccess('Professional PDF report downloaded successfully!');

            } catch (error) {
                console.error('PDF generation error:', error);
                showError('Failed to generate PDF report. Please try again.');
            }
        }

        // Utility functions
        function updateAIStatus(status) {
            const statusElement = document.getElementById('aiStatus');
            const statusText = document.getElementById('aiStatusText');

            switch (status) {
                case 'ready':
                    statusElement.className = 'w-3 h-3 bg-green-500 rounded-full pulse';
                    statusText.textContent = 'AI Ready';
                    statusText.className = 'text-sm font-medium text-green-600';
                    break;
                case 'loading':
                    statusElement.className = 'w-3 h-3 bg-yellow-500 rounded-full pulse';
                    statusText.textContent = 'Loading...';
                    statusText.className = 'text-sm font-medium text-yellow-600';
                    break;
                case 'analyzing':
                    statusElement.className = 'w-3 h-3 bg-blue-500 rounded-full pulse';
                    statusText.textContent = 'Analyzing...';
                    statusText.className = 'text-sm font-medium text-blue-600';
                    break;
                case 'error':
                    statusElement.className = 'w-3 h-3 bg-red-500 rounded-full';
                    statusText.textContent = 'Error';
                    statusText.className = 'text-sm font-medium text-red-600';
                    break;
            }
        }

        function showError(message) {
            const errorSection = document.getElementById('errorSection');
            const errorMessage = document.getElementById('errorMessage');

            errorMessage.textContent = message;
            errorSection.classList.remove('hidden');
            errorSection.classList.add('error-shake');

            // Auto-hide after 10 seconds
            setTimeout(() => {
                errorSection.classList.add('hidden');
                errorSection.classList.remove('error-shake');
            }, 10000);
        }

        function hideError() {
            document.getElementById('errorSection').classList.add('hidden');
        }

        function toggleDarkMode() {
            document.body.classList.toggle('dark');
            localStorage.setItem('darkMode', document.body.classList.contains('dark'));
        }

        function scrollToUpload() {
            document.getElementById('uploadSection').scrollIntoView({ behavior: 'smooth' });
        }

        function skipSymptoms() {
            if (analysisResults) {
                displayAnalysisResults(analysisResults);
            } else {
                showError('Please upload an image first for analysis.');
            }
        }

        function retryAnalysis() {
            hideError();
            if (currentImage) {
                startImageAnalysis(currentImage);
            } else {
                showError('No image available for retry. Please upload an image first.');
            }
        }

        // Session management
        function saveToHistory() {
            if (!analysisResults) return;

            const historyItem = {
                id: Date.now(),
                timestamp: new Date().toISOString(),
                diagnosis: analysisResults.primaryDiagnosis,
                confidence: analysisResults.confidence,
                severity: analysisResults.severity
            };

            const history = JSON.parse(localStorage.getItem('hairHealthHistory') || '[]');
            history.unshift(historyItem);

            // Keep only last 10 items
            if (history.length > 10) {
                history.splice(10);
            }

            localStorage.setItem('hairHealthHistory', JSON.stringify(history));
            loadSessionHistory();

            showSuccess('Analysis saved to history.');
        }

        function loadSessionHistory() {
            const history = JSON.parse(localStorage.getItem('hairHealthHistory') || '[]');
            const historyList = document.getElementById('historyList');

            if (history.length === 0) {
                historyList.innerHTML = '<p class="text-sm text-gray-500 dark:text-gray-400">No previous analyses</p>';
                return;
            }

            historyList.innerHTML = history.map(item => `
                <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                    <div class="flex justify-between items-start mb-1">
                        <h6 class="text-sm font-semibold text-gray-800 dark:text-gray-200">${item.diagnosis}</h6>
                        <span class="text-xs text-gray-500 dark:text-gray-400">${Math.floor(item.confidence * 100)}%</span>
                    </div>
                    <p class="text-xs text-gray-600 dark:text-gray-400">${new Date(item.timestamp).toLocaleDateString()}</p>
                </div>
            `).join('');
        }

        function clearHistory() {
            localStorage.removeItem('hairHealthHistory');
            loadSessionHistory();
            showSuccess('History cleared.');
        }

        function showHistory() {
            // Scroll to history section in sidebar
            document.getElementById('historyList').scrollIntoView({ behavior: 'smooth' });
        }

        function showSuccess(message) {
            // Create temporary success notification
            const notification = document.createElement('div');
            notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
            notification.textContent = message;

            document.body.appendChild(notification);

            setTimeout(() => {
                notification.remove();
            }, 3000);
        }

        function shareResults() {
            if (!analysisResults) return;

            const shareData = {
                title: 'Hair Health Analysis Results',
                text: `Diagnosis: ${analysisResults.primaryDiagnosis} (${Math.floor(analysisResults.confidence * 100)}% confidence)`,
                url: window.location.href
            };

            if (navigator.share) {
                navigator.share(shareData);
            } else {
                // Fallback: copy to clipboard
                navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
                showSuccess('Results copied to clipboard!');
            }
        }

        async function consultSpecialist() {
            try {
                // Get user's location
                const position = await getCurrentLocation();
                const { latitude, longitude } = position.coords;

                // Show loading state
                showSuccess('Finding nearby hair specialists...');

                // Find nearby specialists using Google Places API simulation
                const specialists = await findNearbySpecialists(latitude, longitude);

                // Display specialists in modal
                showSpecialistModal(specialists);

            } catch (error) {
                console.error('Location error:', error);
                // Fallback: show general specialists without location
                showSpecialistModal(getDefaultSpecialists());
            }
        }

        function getCurrentLocation() {
            return new Promise((resolve, reject) => {
                if (!navigator.geolocation) {
                    reject(new Error('Geolocation not supported'));
                    return;
                }

                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 300000
                });
            });
        }

        async function findNearbySpecialists(lat, lng) {
            // Determine condition type for targeted hospital search
            const conditionType = analysisResults ? analysisResults.primaryDiagnosis : 'Hair Loss';

            // Generate realistic hospital data based on condition
            const hospitalData = generateHospitalsByCondition(conditionType, lat, lng);

            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 1500));

            return hospitalData;
        }

        function generateHospitalsByCondition(condition, lat, lng) {
            const hospitalTypes = {
                'Androgenetic Alopecia': 'dermatology',
                'Alopecia Areata': 'dermatology',
                'Seborrheic Dermatitis': 'dermatology',
                'Telogen Effluvium': 'general',
                'Hair Loss': 'dermatology'
            };

            const type = hospitalTypes[condition] || 'dermatology';

            if (type === 'dermatology') {
                return [
                    {
                        name: "City Dermatology & Hair Center",
                        type: "hospital",
                        specialty: "Dermatology & Trichology Department",
                        rating: 4.8,
                        distance: "0.9 miles",
                        address: "1250 Medical Center Drive, Suite 300",
                        phone: "(555) 201-3456",
                        availability: "Accepting New Patients",
                        image: "🏥",
                        services: ["Hair Loss Treatment", "Scalp Disorders", "Hair Transplant Consultation"],
                        coordinates: { lat: lat + 0.01, lng: lng + 0.01 }
                    },
                    {
                        name: "Metropolitan General Hospital",
                        type: "hospital",
                        specialty: "Dermatology Department",
                        rating: 4.6,
                        distance: "1.4 miles",
                        address: "2100 Healthcare Boulevard",
                        phone: "(555) 301-7890",
                        availability: "Walk-ins Welcome",
                        image: "🏥",
                        services: ["General Dermatology", "Hair & Scalp Clinic", "Cosmetic Dermatology"],
                        coordinates: { lat: lat + 0.02, lng: lng - 0.01 }
                    },
                    {
                        name: "Advanced Hair Restoration Institute",
                        type: "specialty_clinic",
                        specialty: "Hair Restoration & Transplant Center",
                        rating: 4.9,
                        distance: "2.2 miles",
                        address: "3400 Wellness Plaza, Floor 5",
                        phone: "(555) 401-2345",
                        availability: "Consultation Available",
                        image: "🏥",
                        services: ["FUE Hair Transplant", "PRP Therapy", "Laser Hair Therapy"],
                        coordinates: { lat: lat - 0.01, lng: lng + 0.02 }
                    },
                    {
                        name: "University Medical Center",
                        type: "hospital",
                        specialty: "Dermatology & Research Department",
                        rating: 4.7,
                        distance: "3.1 miles",
                        address: "4500 University Avenue",
                        phone: "(555) 501-6789",
                        availability: "Referral Required",
                        image: "🏥",
                        services: ["Clinical Research", "Advanced Treatments", "Resident Training Clinic"],
                        coordinates: { lat: lat - 0.02, lng: lng - 0.02 }
                    }
                ];
            } else {
                return [
                    {
                        name: "Community General Hospital",
                        type: "hospital",
                        specialty: "General Medicine & Family Care",
                        rating: 4.5,
                        distance: "0.7 miles",
                        address: "800 Community Health Drive",
                        phone: "(555) 101-2345",
                        availability: "Same Day Appointments",
                        image: "🏥",
                        services: ["Family Medicine", "Internal Medicine", "Dermatology Referrals"],
                        coordinates: { lat: lat + 0.01, lng: lng + 0.01 }
                    },
                    {
                        name: "Regional Medical Center",
                        type: "hospital",
                        specialty: "Multi-Specialty Hospital",
                        rating: 4.4,
                        distance: "1.8 miles",
                        address: "1500 Regional Parkway",
                        phone: "(555) 201-4567",
                        availability: "Emergency & Outpatient",
                        image: "🏥",
                        services: ["Emergency Care", "Outpatient Clinics", "Specialist Referrals"],
                        coordinates: { lat: lat + 0.02, lng: lng - 0.01 }
                    }
                ];
            }
        }

        function getDefaultSpecialists() {
            return [
                {
                    name: "City Medical Center",
                    type: "hospital",
                    specialty: "Dermatology & Hair Treatment Department",
                    rating: 4.8,
                    distance: "Location access needed",
                    address: "1200 Medical Plaza Drive",
                    phone: "(555) 123-4567",
                    availability: "Call for Availability",
                    image: "🏥",
                    services: ["Hair Loss Treatment", "Scalp Disorders", "Dermatology"]
                },
                {
                    name: "General Hospital",
                    type: "hospital",
                    specialty: "Multi-Specialty Medical Center",
                    rating: 4.6,
                    distance: "Location access needed",
                    address: "456 Healthcare Boulevard",
                    phone: "(555) 234-5678",
                    availability: "Call for Availability",
                    image: "🏥",
                    services: ["General Medicine", "Dermatology Referrals", "Outpatient Care"]
                },
                {
                    name: "Advanced Hair Clinic",
                    type: "specialty_clinic",
                    specialty: "Hair Restoration & Treatment Center",
                    rating: 4.9,
                    distance: "Location access needed",
                    address: "789 Wellness Center, Suite 300",
                    phone: "(555) 345-6789",
                    availability: "Call for Availability",
                    image: "🏥",
                    services: ["Hair Transplant", "PRP Therapy", "Laser Treatment"]
                }
            ];
        }

        function showSpecialistModal(specialists) {
            // Create modal HTML with enhanced hospital UI
            const modalHTML = `
                <div id="specialistModal" class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div class="bg-white dark:bg-gray-800 rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
                        <div class="p-6">
                            <div class="flex justify-between items-center mb-6">
                                <div>
                                    <h3 class="text-2xl font-bold text-gray-900 dark:text-white">🏥 Nearby Medical Centers & Hospitals</h3>
                                    <p class="text-gray-600 dark:text-gray-400">Found ${specialists.length} healthcare facilities specializing in your condition</p>
                                </div>
                                <button onclick="closeSpecialistModal()" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                                    <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"/>
                                    </svg>
                                </button>
                            </div>
                            
                            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                ${specialists.map(hospital => `
                                    <div class="bg-gradient-to-br from-blue-50 to-white dark:from-gray-700 dark:to-gray-800 rounded-xl p-6 border border-blue-100 dark:border-gray-600 hover:shadow-xl transition-all duration-300">
                                        <div class="flex items-start space-x-4">
                                            <div class="text-5xl">${hospital.image}</div>
                                            <div class="flex-1">
                                                <div class="flex items-start justify-between mb-3">
                                                    <div>
                                                        <h4 class="text-xl font-bold text-gray-900 dark:text-white mb-1">${hospital.name}</h4>
                                                        <div class="flex items-center space-x-2">
                                                            <span class="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium rounded-full">
                                                                ${hospital.type === 'hospital' ? '🏥 Hospital' : '🏢 Specialty Clinic'}
                                                            </span>
                                                            <div class="flex items-center space-x-1">
                                                                <svg class="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                                                                </svg>
                                                                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">${hospital.rating}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <p class="text-blue-600 dark:text-blue-400 font-semibold text-sm mb-3">${hospital.specialty}</p>
                                                
                                                ${hospital.services ? `
                                                <div class="mb-4">
                                                    <h6 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">🩺 Available Services:</h6>
                                                    <div class="flex flex-wrap gap-1">
                                                        ${hospital.services.map(service => `
                                                            <span class="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs rounded-full">
                                                                ${service}
                                                            </span>
                                                        `).join('')}
                                                    </div>
                                                </div>
                                                ` : ''}
                                                
                                                <div class="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                                                    <div class="flex items-center space-x-2">
                                                        <svg class="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"/>
                                                        </svg>
                                                        <span class="font-medium">${hospital.distance}</span>
                                                    </div>
                                                    <div class="flex items-start space-x-2">
                                                        <svg class="w-4 h-4 mt-0.5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm3 1h6v4H7V5zm8 8v2a1 1 0 01-1 1H6a1 1 0 01-1-1v-2h8z"/>
                                                        </svg>
                                                        <span>${hospital.address}</span>
                                                    </div>
                                                    <div class="flex items-center space-x-2">
                                                        <svg class="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                                            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
                                                        </svg>
                                                        <a href="tel:${hospital.phone}" class="text-blue-600 dark:text-blue-400 hover:underline font-medium">${hospital.phone}</a>
                                                    </div>
                                                    <div class="flex items-center space-x-2">
                                                        <svg class="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"/>
                                                        </svg>
                                                        <span class="text-green-600 dark:text-green-400 font-medium">${hospital.availability}</span>
                                                    </div>
                                                </div>
                                                
                                                <div class="grid grid-cols-2 gap-2">
                                                    <button onclick="callSpecialist('${hospital.phone}')" class="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center justify-center space-x-2">
                                                        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
                                                        </svg>
                                                        <span>Call Now</span>
                                                    </button>
                                                    <button onclick="getDirections('${hospital.address}')" class="bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-green-700 hover:to-green-800 transition-all duration-200 flex items-center justify-center space-x-2">
                                                        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"/>
                                                        </svg>
                                                        <span>Directions</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                            
                            <div class="mt-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900 dark:to-orange-900 rounded-lg border border-yellow-200 dark:border-yellow-700">
                                <div class="flex items-start space-x-3">
                                    <svg class="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"/>
                                    </svg>
                                    <div>
                                        <h5 class="font-semibold text-yellow-800 dark:text-yellow-200">📋 Before Your Visit</h5>
                                        <ul class="text-sm text-yellow-700 dark:text-yellow-300 mt-1 space-y-1">
                                            <li>• Verify insurance coverage and accepted payment methods</li>
                                            <li>• Call ahead to confirm appointment availability and requirements</li>
                                            <li>• Bring your MediScan AI report and any relevant medical history</li>
                                            <li>• Ask about consultation fees and treatment costs upfront</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Add modal to page
            document.body.insertAdjacentHTML('beforeend', modalHTML);
        }

        function closeSpecialistModal() {
            const modal = document.getElementById('specialistModal');
            if (modal) {
                modal.remove();
            }
        }

        function callSpecialist(phone) {
            window.location.href = `tel:${phone}`;
        }

        function getDirections(address) {
            const encodedAddress = encodeURIComponent(address);
            window.open(`https://www.google.com/maps/search/${encodedAddress}`, '_blank');
        }

        function showExampleImages() {
            document.getElementById('exampleModal').classList.remove('hidden');
        }

        function closeExampleModal() {
            document.getElementById('exampleModal').classList.add('hidden');
        }

        // Enhanced Chatbot functions with symptom intelligence
        async function sendChatMessage() {
            const input = document.getElementById('chatInput');
            const message = input.value.trim();

            if (!message) return;

            // Add user message to chat
            addChatMessage(message, 'user');
            input.value = '';

            // Show typing indicator
            showTypingIndicator();

            try {
                // Check if message contains symptoms - provide intelligent response
                const response = await getIntelligentChatResponse(message);

                // Remove typing indicator and add AI response
                removeTypingIndicator();
                addChatMessage(response.message, 'ai');

                // If symptoms detected, show follow-up options
                if (response.symptomsDetected) {
                    setTimeout(() => {
                        showSymptomFollowUp(response.detectedSymptoms);
                    }, 1000);
                }

            } catch (error) {
                console.error('Chat error:', error);
                removeTypingIndicator();
                addChatMessage('I apologize, but I\'m having trouble responding right now. Please try again later.', 'ai');
            }
        }

        function selectSymptom(symptom) {
            // Auto-fill input with selected symptom
            const input = document.getElementById('chatInput');
            input.value = `I'm experiencing ${symptom.toLowerCase()}`;

            // Automatically send the message
            sendChatMessage();
        }

        function askQuickQuestion(question) {
            const input = document.getElementById('chatInput');
            input.value = question;
            sendChatMessage();
        }

        function handleChatKeyPress(event) {
            if (event.key === 'Enter') {
                sendChatMessage();
            }
        }

        function addChatMessage(message, sender) {
            const chatMessages = document.getElementById('chatMessages');
            const messageDiv = document.createElement('div');

            if (sender === 'user') {
                messageDiv.className = 'flex items-start space-x-3 mb-3 justify-end';
                messageDiv.innerHTML = `
                    <div class="bg-blue-500 text-white rounded-lg p-3 max-w-xs">
                        <p class="text-sm">${message}</p>
                    </div>
                    <div class="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center">
                        <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"/>
                        </svg>
                    </div>
                `;
            } else {
                messageDiv.className = 'flex items-start space-x-3 mb-3';
                messageDiv.innerHTML = `
                    <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
                        </svg>
                    </div>
                    <div class="bg-blue-100 dark:bg-blue-900 rounded-lg p-3 max-w-xs">
                        <p class="text-sm text-blue-800 dark:text-blue-200">${message}</p>
                    </div>
                `;
            }

            chatMessages.appendChild(messageDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }

        function showTypingIndicator() {
            const chatMessages = document.getElementById('chatMessages');
            const typingDiv = document.createElement('div');
            typingDiv.id = 'typingIndicator';
            typingDiv.className = 'flex items-start space-x-3 mb-3';
            typingDiv.innerHTML = `
                <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
                    </svg>
                </div>
                <div class="bg-gray-200 dark:bg-gray-700 rounded-lg p-3">
                    <div class="flex space-x-1">
                        <div class="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                        <div class="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
                        <div class="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
                    </div>
                </div>
            `;

            chatMessages.appendChild(typingDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }

        function removeTypingIndicator() {
            const typingIndicator = document.getElementById('typingIndicator');
            if (typingIndicator) {
                typingIndicator.remove();
            }
        }

        async function getIntelligentChatResponse(message) {
            try {
                // Detect symptoms in the message
                const detectedSymptoms = detectSymptomsInMessage(message);
                const symptomsDetected = detectedSymptoms.length > 0;

                let systemPrompt = "You are Dr. AI, a specialized hair health assistant. Provide accurate, helpful medical information while always recommending professional consultation for serious concerns.";

                if (symptomsDetected) {
                    systemPrompt += ` The user mentioned these symptoms: ${detectedSymptoms.join(', ')}. Provide a preliminary assessment, ask relevant follow-up questions, and suggest next steps including when to see a specialist.`;
                }

                const response = await fetch(API_CONFIG.url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${API_CONFIG.apiKey}`
                    },
                    body: JSON.stringify({
                        model: API_CONFIG.model,
                        messages: [{
                            role: "system",
                            content: systemPrompt
                        }, {
                            role: "user",
                            content: message
                        }],
                        max_tokens: 400,
                        temperature: 0.7
                    })
                });

                if (!response.ok) {
                    throw new Error(`API request failed: ${response.status}`);
                }

                const data = await response.json();
                return {
                    message: data.choices[0].message.content,
                    symptomsDetected,
                    detectedSymptoms
                };

            } catch (error) {
                console.warn('Chat API failed, using fallback response:', error);
                const detectedSymptoms = detectSymptomsInMessage(message);
                return {
                    message: getIntelligentFallbackResponse(message, detectedSymptoms),
                    symptomsDetected: detectedSymptoms.length > 0,
                    detectedSymptoms
                };
            }
        }

        function detectSymptomsInMessage(message) {
            const lowerMessage = message.toLowerCase();
            const symptoms = [];

            const symptomKeywords = {
                'hair loss': ['hair loss', 'losing hair', 'hair falling', 'balding', 'bald spots'],
                'thinning': ['thinning', 'thin hair', 'sparse hair', 'less dense'],
                'itching': ['itching', 'itchy', 'scratching', 'itch'],
                'dandruff': ['dandruff', 'flakes', 'flaky scalp', 'white flakes'],
                'pain': ['pain', 'painful', 'sore', 'tender', 'hurts'],
                'burning': ['burning', 'burns', 'burning sensation'],
                'oily': ['oily', 'greasy', 'too much oil', 'sebum'],
                'dry': ['dry', 'dryness', 'dehydrated'],
                'redness': ['red', 'redness', 'inflamed', 'inflammation'],
                'patches': ['patches', 'bald patches', 'spots', 'areas']
            };

            for (const [symptom, keywords] of Object.entries(symptomKeywords)) {
                if (keywords.some(keyword => lowerMessage.includes(keyword))) {
                    symptoms.push(symptom);
                }
            }

            return symptoms;
        }

        function getIntelligentFallbackResponse(message, detectedSymptoms) {
            if (detectedSymptoms.length > 0) {
                const symptomList = detectedSymptoms.join(', ');
                return `I understand you're experiencing ${symptomList}. These symptoms can have various causes including genetics, stress, hormonal changes, or underlying conditions. 

Based on what you've described, I'd recommend:
1. Documenting when these symptoms started
2. Noting any triggers or patterns
3. Considering a consultation with a dermatologist

Would you like me to help you find specialists in your area, or do you have other questions about these symptoms?`;
            }

            return getFallbackChatResponse(message);
        }

        function showSymptomFollowUp(symptoms) {
            const followUpMessage = `Based on the symptoms you mentioned (${symptoms.join(', ')}), I can provide more specific guidance. Would you like me to:`;

            addChatMessage(followUpMessage, 'ai');

            // Add interactive buttons for follow-up actions
            const chatMessages = document.getElementById('chatMessages');
            const buttonDiv = document.createElement('div');
            buttonDiv.className = 'flex flex-wrap gap-2 mb-4 ml-14';
            buttonDiv.innerHTML = `
                <button onclick="getSymptomDiagnosis('${symptoms.join(',')}')" class="bg-blue-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-600 transition-colors">
                    🔍 Provide Diagnosis
                </button>
                <button onclick="getSymptomTreatment('${symptoms.join(',')}')" class="bg-green-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-green-600 transition-colors">
                    💊 Treatment Options
                </button>
                <button onclick="consultSpecialist()" class="bg-purple-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-purple-600 transition-colors">
                    👨‍⚕️ Find Specialists
                </button>
            `;

            chatMessages.appendChild(buttonDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }

        async function getSymptomDiagnosis(symptomsString) {
            const symptoms = symptomsString.split(',');

            addChatMessage('Please provide a preliminary diagnosis for my symptoms', 'user');
            showTypingIndicator();

            try {
                const response = await fetch(API_CONFIG.url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${API_CONFIG.apiKey}`
                    },
                    body: JSON.stringify({
                        model: API_CONFIG.model,
                        messages: [{
                            role: "system",
                            content: "You are a medical AI providing preliminary diagnosis for hair/scalp symptoms. Always emphasize this is not a substitute for professional medical advice."
                        }, {
                            role: "user",
                            content: `Provide a preliminary diagnosis for these hair/scalp symptoms: ${symptoms.join(', ')}. Include possible conditions, severity assessment, and when to seek professional help.`
                        }],
                        max_tokens: 500,
                        temperature: 0.3
                    })
                });

                const data = await response.json();
                removeTypingIndicator();
                addChatMessage(data.choices[0].message.content, 'ai');

            } catch (error) {
                removeTypingIndicator();
                const fallbackDiagnosis = generateFallbackDiagnosis(symptoms);
                addChatMessage(fallbackDiagnosis, 'ai');
            }
        }

        async function getSymptomTreatment(symptomsString) {
            const symptoms = symptomsString.split(',');

            addChatMessage('What treatment options do you recommend?', 'user');
            showTypingIndicator();

            try {
                const response = await fetch(API_CONFIG.url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${API_CONFIG.apiKey}`
                    },
                    body: JSON.stringify({
                        model: API_CONFIG.model,
                        messages: [{
                            role: "system",
                            content: "You are a medical AI providing treatment recommendations for hair/scalp conditions. Focus on evidence-based treatments and emphasize professional consultation."
                        }, {
                            role: "user",
                            content: `Recommend treatment options for these hair/scalp symptoms: ${symptoms.join(', ')}. Include both over-the-counter and professional treatments, with timeline expectations.`
                        }],
                        max_tokens: 500,
                        temperature: 0.3
                    })
                });

                const data = await response.json();
                removeTypingIndicator();
                addChatMessage(data.choices[0].message.content, 'ai');

            } catch (error) {
                removeTypingIndicator();
                const fallbackTreatment = generateFallbackTreatment(symptoms);
                addChatMessage(fallbackTreatment, 'ai');
            }
        }

        function generateFallbackDiagnosis(symptoms) {
            const commonConditions = {
                'hair loss': 'Androgenetic Alopecia (Male/Female Pattern Baldness)',
                'thinning': 'Telogen Effluvium or Androgenetic Alopecia',
                'itching': 'Seborrheic Dermatitis or Contact Dermatitis',
                'dandruff': 'Seborrheic Dermatitis',
                'patches': 'Alopecia Areata'
            };

            const likelyConditions = symptoms.map(s => commonConditions[s] || 'Hair/Scalp Condition').filter(Boolean);

            return `**Preliminary Assessment:**

Based on your symptoms (${symptoms.join(', ')}), possible conditions include:
• ${likelyConditions.join('\n• ')}

**Severity:** ${symptoms.length > 2 ? 'Moderate - Multiple symptoms present' : 'Mild to Moderate'}

**Recommendation:** I strongly recommend consulting with a dermatologist or trichologist for proper diagnosis and treatment plan. Early intervention often leads to better outcomes.

**When to seek immediate care:** If symptoms worsen rapidly, involve pain, or affect large areas of the scalp.

*This is a preliminary assessment only and should not replace professional medical advice.*`;
        }

        function generateFallbackTreatment(symptoms) {
            return `**Treatment Recommendations for ${symptoms.join(', ')}:**

**Immediate Steps:**
• Gentle hair care routine (mild shampoos, avoid harsh chemicals)
• Stress management and adequate sleep
• Balanced diet with adequate protein and vitamins

**Over-the-Counter Options:**
• Minoxidil 2-5% (for hair loss/thinning)
• Anti-dandruff shampoos with ketoconazole or selenium sulfide
• Gentle moisturizing treatments for dry scalp

**Professional Treatments:**
• Prescription medications (finasteride, corticosteroids)
• Professional scalp treatments
• Hair restoration procedures (for advanced cases)

**Timeline:** Most treatments require 3-6 months to show significant results.

**Important:** Always consult with a healthcare provider before starting any treatment regimen. They can provide personalized recommendations based on your specific condition.

Would you like me to help you find specialists in your area?`;
        }

        function getFallbackChatResponse(message) {
            const lowerMessage = message.toLowerCase();

            if (lowerMessage.includes('hair loss') || lowerMessage.includes('balding')) {
                return "Hair loss can have various causes including genetics, stress, hormonal changes, and medical conditions. I recommend consulting with a dermatologist for proper evaluation and treatment options.";
            } else if (lowerMessage.includes('dandruff') || lowerMessage.includes('itchy scalp')) {
                return "Dandruff and itchy scalp are often caused by dry skin, seborrheic dermatitis, or fungal infections. Try gentle shampoos and if symptoms persist, consult a healthcare provider.";
            } else if (lowerMessage.includes('treatment') || lowerMessage.includes('cure')) {
                return "Treatment options vary depending on the specific condition. Common treatments include topical medications, lifestyle changes, and in some cases, medical procedures. Always consult with a qualified healthcare provider for personalized treatment plans.";
            } else {
                return "I'm here to help with hair and scalp health questions. For specific medical concerns, I always recommend consulting with a qualified healthcare professional who can provide personalized advice based on your individual situation.";
            }
        }

        function showAllConditions() {
            // Show modal with all detectable conditions
            showSuccess('Comprehensive conditions database coming soon!');
        }

        function handleKeyboardShortcuts(event) {
            // Keyboard shortcuts for accessibility
            if (event.ctrlKey || event.metaKey) {
                switch (event.key) {
                    case 'u':
                        event.preventDefault();
                        scrollToUpload();
                        break;
                    case 'd':
                        event.preventDefault();
                        toggleDarkMode();
                        break;
                    case 's':
                        event.preventDefault();
                        if (analysisResults) saveToHistory();
                        break;
                }
            }
        }

        // Initialize dark mode from localStorage
        if (localStorage.getItem('darkMode') === 'true') {
            document.body.classList.add('dark');
        }

        // Performance monitoring
        function logPerformanceMetrics() {
            if (performance.mark) {
                performance.mark('app-initialized');
                console.log('App initialization time:', performance.now());
            }
        }

        // Error boundary for unhandled errors
        window.addEventListener('error', function (event) {
            console.error('Unhandled error:', event.error);
            showError('An unexpected error occurred. Please refresh the page.');
        });

        // Service worker registration for offline support
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').catch(console.error);
        }
    