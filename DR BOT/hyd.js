
        class FacialAnalysisApp {
            constructor() {
                this.video = document.getElementById('video');
                this.canvas = document.getElementById('overlay');
                this.ctx = this.canvas.getContext('2d');
                this.isRunning = false;
                this.modelsLoaded = false;
                this.analysisInterval = null;

                // Analysis tracking for mean calculations
                this.analysisHistory = {
                    hydration: [],
                    smoothness: [],
                    redness: [],
                    oiliness: [],
                    mood: []
                };

                this.initializeElements();
                this.loadModels();
            }

            initializeElements() {
                this.startButton = document.getElementById('startButton');
                this.stopButton = document.getElementById('stopButton');
                this.loadingScreen = document.getElementById('loadingScreen');
                this.mainApp = document.getElementById('mainApp');
                this.loadingProgress = document.getElementById('loadingProgress');
                this.loadingStatus = document.getElementById('loadingStatus');
                this.cameraStatus = document.getElementById('cameraStatus');
                this.errorMessage = document.getElementById('errorMessage');
                this.errorText = document.getElementById('errorText');
                this.downloadButton = document.getElementById('downloadReport');

                // Bind event listeners
                this.startButton.addEventListener('click', () => this.startCamera());
                this.stopButton.addEventListener('click', () => this.stopCamera());
                this.downloadButton.addEventListener('click', () => this.downloadReport());
            }

            async loadModels() {
                try {
                    this.updateLoadingStatus('Loading neural networks...', 10);

                    // Use multiple model sources for better reliability
                    const MODEL_URLS = [
                        'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.13/model/',
                        'https://raw.githubusercontent.com/vladmandic/face-api/master/model/',
                        'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights/'
                    ];

                    let modelUrl = MODEL_URLS[0];

                    // Load SSD MobileNet for better accuracy
                    await faceapi.nets.ssdMobilenetv1.loadFromUri(modelUrl);
                    this.updateLoadingStatus('Face detector loaded...', 25);

                    // Load TinyFaceDetector as backup
                    await faceapi.nets.tinyFaceDetector.loadFromUri(modelUrl);
                    this.updateLoadingStatus('Backup detector loaded...', 40);

                    await faceapi.nets.faceLandmark68Net.loadFromUri(modelUrl);
                    this.updateLoadingStatus('Landmark detector loaded...', 60);

                    await faceapi.nets.faceExpressionNet.loadFromUri(modelUrl);
                    this.updateLoadingStatus('Emotion analyzer loaded...', 80);

                    await faceapi.nets.faceRecognitionNet.loadFromUri(modelUrl);
                    this.updateLoadingStatus('Face recognition loaded...', 95);

                    this.updateLoadingStatus('All models loaded successfully!', 100);

                    setTimeout(() => {
                        this.modelsLoaded = true;
                        this.loadingScreen.classList.add('hidden');
                        this.mainApp.classList.remove('hidden');
                        this.updateCameraStatus('Ready to analyze! Click "Start" to begin', 'green');
                    }, 1500);

                } catch (error) {
                    console.error('Error loading models:', error);
                    this.showError('Failed to load AI models. Please refresh the page and try again.');
                }
            }

            updateLoadingStatus(message, progress) {
                this.loadingStatus.textContent = message;
                this.loadingProgress.style.width = `${progress}%`;
            }

            async startCamera() {
                if (!this.modelsLoaded) {
                    this.showError('AI models are still loading. Please wait...');
                    return;
                }

                try {
                    this.cameraStatus.textContent = 'Starting camera...';

                    const stream = await navigator.mediaDevices.getUserMedia({
                        video: {
                            width: 640,
                            height: 480,
                            facingMode: 'user'
                        }
                    });

                    this.video.srcObject = stream;

                    this.video.addEventListener('loadedmetadata', () => {
                        // Set canvas to match container size for consistent overlay
                        this.canvas.width = 640;
                        this.canvas.height = 480;

                        this.isRunning = true;
                        this.startButton.classList.add('hidden');
                        this.stopButton.classList.remove('hidden');

                        // Show face detection zone guide
                        const faceZone = document.getElementById('faceZone');
                        faceZone.classList.remove('hidden');

                        this.updateCameraStatus('Camera active - Position your face in the detection zone', 'green');

                        // Start analysis
                        this.startAnalysis();
                    });

                } catch (error) {
                    console.error('Camera error:', error);
                    this.showError('Unable to access camera. Please ensure camera permissions are granted.');
                }
            }

            stopCamera() {
                this.isRunning = false;

                if (this.video.srcObject) {
                    this.video.srcObject.getTracks().forEach(track => track.stop());
                    this.video.srcObject = null;
                }

                if (this.analysisInterval) {
                    clearInterval(this.analysisInterval);
                }

                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

                // Hide detection indicators
                document.getElementById('aiStatus').classList.add('hidden');
                document.getElementById('confidenceIndicator').classList.add('hidden');
                document.getElementById('qualityIndicator').classList.add('hidden');
                document.getElementById('faceZone').classList.add('hidden');

                this.startButton.classList.remove('hidden');
                this.stopButton.classList.add('hidden');
                this.updateCameraStatus('Camera stopped - Analysis complete', 'gray');

                // Generate comprehensive analysis report (this will remain visible)
                this.generateAnalysisReport();

                // Keep mood and skin analysis visible, don't reset them
                // this.resetAnalysisDisplay(); // Commented out to keep results visible
            }

            startAnalysis() {
                this.analysisInterval = setInterval(async () => {
                    if (!this.isRunning) return;

                    try {
                        // Use SSD MobileNet for better accuracy, fallback to TinyFaceDetector
                        let detections;
                        try {
                            detections = await faceapi
                                .detectAllFaces(this.video, new faceapi.SsdMobilenetv1Options({
                                    minConfidence: 0.5,
                                    maxResults: 1
                                }))
                                .withFaceLandmarks()
                                .withFaceExpressions();
                        } catch (ssdError) {
                            // Fallback to TinyFaceDetector
                            detections = await faceapi
                                .detectAllFaces(this.video, new faceapi.TinyFaceDetectorOptions({
                                    inputSize: 416,
                                    scoreThreshold: 0.5
                                }))
                                .withFaceLandmarks()
                                .withFaceExpressions();
                        }

                        // Clear previous drawings
                        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

                        if (detections.length > 0) {
                            const detection = detections[0];

                            // Enhanced face detection visualization
                            this.drawAdvancedFaceDetection(detection);

                            // Analyze expressions with confidence scoring
                            this.analyzeMoodWithConfidence(detection.expressions);

                            // Advanced skin analysis
                            this.analyzeSkinAdvanced(detection);

                            this.updateCameraStatus('Face detected - Analyzing...', 'green');
                        } else {
                            // Show face zone guide when no face is detected
                            const faceZone = document.getElementById('faceZone');
                            const aiStatus = document.getElementById('aiStatus');
                            const confidenceIndicator = document.getElementById('confidenceIndicator');
                            const qualityIndicator = document.getElementById('qualityIndicator');

                            faceZone.classList.remove('hidden');
                            aiStatus.classList.add('hidden');
                            confidenceIndicator.classList.add('hidden');
                            qualityIndicator.classList.add('hidden');

                            this.updateCameraStatus('Position your face in the detection zone', 'yellow');
                            // Don't reset analysis display to keep previous results visible
                        }

                    } catch (error) {
                        console.error('Analysis error:', error);
                        this.updateCameraStatus('⚠️ Analysis error - Please try again', 'red');
                    }
                }, 300); // Faster analysis for better real-time experience
            }

            drawAdvancedFaceDetection(detection) {
                const box = detection.detection.box;
                const landmarks = detection.landmarks;
                const confidence = detection.detection.score;

                // Update UI indicators
                this.updateDetectionIndicators(confidence, box);

                // Create enhanced face detection box with better visual feedback
                this.drawEnhancedFaceBox(box, confidence);

                // Draw improved landmarks with better visibility
                if (landmarks) {
                    this.drawEnhancedLandmarks(landmarks, confidence);
                }

                // Update confidence and quality indicators
                this.updateConfidenceDisplay(confidence);
            }

            drawEnhancedFaceBox(box, confidence) {
                const time = Date.now() * 0.003;
                const pulse = Math.sin(time) * 0.2 + 0.8;

                // Main detection box with confidence-based styling
                const alpha = Math.max(0.4, confidence);
                const hue = confidence > 0.7 ? '120' : confidence > 0.4 ? '60' : '0'; // Green to red based on confidence

                // Outer glow effect
                this.ctx.shadowColor = `hsla(${hue}, 100%, 50%, ${alpha * 0.6})`;
                this.ctx.shadowBlur = 15;

                // Main border with gradient
                const gradient = this.ctx.createLinearGradient(box.x, box.y, box.x + box.width, box.y + box.height);
                gradient.addColorStop(0, `hsla(180, 100%, 50%, ${alpha})`);
                gradient.addColorStop(0.5, `hsla(${hue}, 100%, 50%, ${alpha})`);
                gradient.addColorStop(1, `hsla(270, 100%, 50%, ${alpha})`);

                this.ctx.strokeStyle = gradient;
                this.ctx.lineWidth = 3;
                this.ctx.strokeRect(box.x, box.y, box.width, box.height);

                // Reset shadow
                this.ctx.shadowBlur = 0;

                // Corner indicators with improved animation
                const cornerSize = Math.min(30, box.width * 0.15, box.height * 0.15);
                this.ctx.strokeStyle = `hsla(180, 100%, 50%, ${pulse})`;
                this.ctx.lineWidth = 4;
                this.ctx.lineCap = 'round';

                // Enhanced corner design
                const corners = [
                    // Top-left
                    { x: box.x, y: box.y, dx: cornerSize, dy: 0 },
                    { x: box.x, y: box.y, dx: 0, dy: cornerSize },
                    // Top-right
                    { x: box.x + box.width, y: box.y, dx: -cornerSize, dy: 0 },
                    { x: box.x + box.width, y: box.y, dx: 0, dy: cornerSize },
                    // Bottom-left
                    { x: box.x, y: box.y + box.height, dx: cornerSize, dy: 0 },
                    { x: box.x, y: box.y + box.height, dx: 0, dy: -cornerSize },
                    // Bottom-right
                    { x: box.x + box.width, y: box.y + box.height, dx: -cornerSize, dy: 0 },
                    { x: box.x + box.width, y: box.y + box.height, dx: 0, dy: -cornerSize }
                ];

                corners.forEach(corner => {
                    this.ctx.beginPath();
                    this.ctx.moveTo(corner.x, corner.y);
                    this.ctx.lineTo(corner.x + corner.dx, corner.y + corner.dy);
                    this.ctx.stroke();
                });

                // Center crosshair for better positioning feedback
                const centerX = box.x + box.width / 2;
                const centerY = box.y + box.height / 2;
                const crossSize = 8;

                this.ctx.strokeStyle = `rgba(255, 255, 255, ${pulse * 0.8})`;
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.moveTo(centerX - crossSize, centerY);
                this.ctx.lineTo(centerX + crossSize, centerY);
                this.ctx.moveTo(centerX, centerY - crossSize);
                this.ctx.lineTo(centerX, centerY + crossSize);
                this.ctx.stroke();
            }

            drawEnhancedLandmarks(landmarks, confidence) {
                const alpha = Math.max(0.3, confidence * 0.8);

                // Draw key landmark groups with different colors
                const landmarkGroups = [
                    { points: landmarks.getLeftEye(), color: `rgba(0, 255, 255, ${alpha})`, size: 2 },
                    { points: landmarks.getRightEye(), color: `rgba(0, 255, 255, ${alpha})`, size: 2 },
                    { points: landmarks.getNose(), color: `rgba(255, 255, 0, ${alpha})`, size: 1.5 },
                    { points: landmarks.getMouth(), color: `rgba(255, 100, 255, ${alpha})`, size: 2 }
                ];

                landmarkGroups.forEach(group => {
                    this.ctx.strokeStyle = group.color;
                    this.ctx.fillStyle = group.color;
                    this.ctx.lineWidth = group.size;

                    // Draw connecting lines
                    this.ctx.beginPath();
                    group.points.forEach((point, i) => {
                        if (i === 0) this.ctx.moveTo(point.x, point.y);
                        else this.ctx.lineTo(point.x, point.y);
                    });
                    if (group.points === landmarks.getLeftEye() || group.points === landmarks.getRightEye() || group.points === landmarks.getMouth()) {
                        this.ctx.closePath();
                    }
                    this.ctx.stroke();

                    // Draw landmark points
                    group.points.forEach(point => {
                        this.ctx.beginPath();
                        this.ctx.arc(point.x, point.y, group.size, 0, 2 * Math.PI);
                        this.ctx.fill();
                    });
                });
            }

            updateDetectionIndicators(confidence, box) {
                const aiStatus = document.getElementById('aiStatus');
                const faceZone = document.getElementById('faceZone');

                // Show AI active status
                aiStatus.classList.remove('hidden');

                // Hide face zone guide when face is detected
                faceZone.classList.add('hidden');
            }

            updateConfidenceDisplay(confidence) {
                const confidenceIndicator = document.getElementById('confidenceIndicator');
                const confidenceText = document.getElementById('confidenceText');
                const qualityIndicator = document.getElementById('qualityIndicator');
                const qualityText = document.getElementById('qualityText');
                const qualityDot = document.getElementById('qualityDot');

                // Show confidence indicator
                confidenceIndicator.classList.remove('hidden');
                confidenceText.textContent = `Confidence: ${Math.round(confidence * 100)}%`;

                // Show quality indicator with color coding
                qualityIndicator.classList.remove('hidden');

                if (confidence > 0.8) {
                    qualityText.textContent = 'Excellent';
                    qualityDot.className = 'w-2 h-2 bg-green-400 rounded-full';
                } else if (confidence > 0.6) {
                    qualityText.textContent = 'Good';
                    qualityDot.className = 'w-2 h-2 bg-blue-400 rounded-full';
                } else if (confidence > 0.4) {
                    qualityText.textContent = 'Fair';
                    qualityDot.className = 'w-2 h-2 bg-yellow-400 rounded-full';
                } else {
                    qualityText.textContent = 'Poor';
                    qualityDot.className = 'w-2 h-2 bg-red-400 rounded-full';
                }
            }

            analyzeMoodWithConfidence(expressions) {
                const moodIndicators = document.getElementById('moodIndicators');
                moodIndicators.classList.remove('hidden');

                // Get dominant emotion with confidence threshold
                let dominantEmotion = 'neutral';
                let maxScore = 0;
                let confidenceLevel = 'low';

                // Calculate emotion scores with weighted confidence
                const emotionScores = {};
                Object.keys(expressions).forEach(emotion => {
                    const score = expressions[emotion];
                    emotionScores[emotion] = score;
                    if (score > maxScore) {
                        maxScore = score;
                        dominantEmotion = emotion;
                    }
                });

                // Determine confidence level
                if (maxScore > 0.7) confidenceLevel = 'high';
                else if (maxScore > 0.4) confidenceLevel = 'medium';
                else confidenceLevel = 'low';

                // Update mood indicators with enhanced styling
                document.querySelectorAll('.mood-indicator').forEach(indicator => {
                    const mood = indicator.dataset.mood;
                    const scoreElement = indicator.querySelector('.mood-score');
                    const score = Math.round(expressions[mood] * 100);

                    scoreElement.textContent = `${score}%`;

                    // Enhanced highlighting with confidence-based styling
                    indicator.classList.remove('active', 'bg-blue-100', 'border-2', 'border-blue-500', 'bg-green-100', 'border-green-500', 'bg-yellow-100', 'border-yellow-500');

                    if (mood === dominantEmotion && score > 25) {
                        indicator.classList.add('active');

                        // Color coding based on confidence
                        if (confidenceLevel === 'high') {
                            indicator.classList.add('bg-green-100', 'border-2', 'border-green-500');
                            indicator.style.transform = 'scale(1.1)';
                        } else if (confidenceLevel === 'medium') {
                            indicator.classList.add('bg-blue-100', 'border-2', 'border-blue-500');
                            indicator.style.transform = 'scale(1.05)';
                        } else {
                            indicator.classList.add('bg-yellow-100', 'border-2', 'border-yellow-500');
                            indicator.style.transform = 'scale(1.02)';
                        }
                    } else {
                        indicator.style.transform = 'scale(1)';
                    }
                });

                // Store enhanced mood data for analysis
                this.analysisHistory.mood.push({
                    emotion: dominantEmotion,
                    score: maxScore,
                    confidence: confidenceLevel,
                    allScores: emotionScores,
                    timestamp: Date.now()
                });

                // Keep only last 30 mood readings for better analysis
                if (this.analysisHistory.mood.length > 30) {
                    this.analysisHistory.mood.shift();
                }

                // Update recommendations with confidence-aware analysis
                this.updateMoodRecommendationsAdvanced(dominantEmotion, maxScore, confidenceLevel);
            }

            analyzeSkinAdvanced(detection) {
                // Extract multiple face regions for comprehensive analysis
                const box = detection.detection.box;
                const landmarks = detection.landmarks;

                // Create a temporary canvas to extract face pixels
                const tempCanvas = document.createElement('canvas');
                const tempCtx = tempCanvas.getContext('2d');
                tempCanvas.width = box.width;
                tempCanvas.height = box.height;

                // Draw face region with higher quality
                tempCtx.imageSmoothingEnabled = true;
                tempCtx.imageSmoothingQuality = 'high';
                tempCtx.drawImage(
                    this.video,
                    box.x, box.y, box.width, box.height,
                    0, 0, box.width, box.height
                );

                // Get image data for analysis
                const imageData = tempCtx.getImageData(0, 0, box.width, box.height);
                const pixels = imageData.data;

                // Advanced skin analysis with region-specific analysis
                const skinAnalysis = this.analyzeSkinPixelsAdvanced(pixels, box, landmarks);

                // Store analysis data with confidence scoring
                this.analysisHistory.hydration.push(skinAnalysis.hydration);
                this.analysisHistory.smoothness.push(skinAnalysis.smoothness);
                this.analysisHistory.redness.push(skinAnalysis.redness);
                this.analysisHistory.oiliness.push(skinAnalysis.oiliness);

                // Keep only last 25 readings for better rolling average
                if (this.analysisHistory.hydration.length > 25) {
                    this.analysisHistory.hydration.shift();
                    this.analysisHistory.smoothness.shift();
                    this.analysisHistory.redness.shift();
                    this.analysisHistory.oiliness.shift();
                }

                // Update skin metrics display with enhanced visualization
                this.updateSkinDisplayAdvanced(skinAnalysis);

                // Update skin recommendations with AI insights
                this.updateSkinRecommendationsAdvanced(skinAnalysis);
            }

            analyzeSkinPixelsAdvanced(pixels, box, landmarks) {
                let totalR = 0, totalG = 0, totalB = 0;
                let pixelCount = 0;
                let rednessCount = 0;
                let brightnessSum = 0;
                let textureVariance = 0;
                let shinyPixels = 0;
                let saturationSum = 0;
                let contrastSum = 0;
                let dryPatches = 0;
                let smoothAreas = 0;
                let inflammationPixels = 0;
                let porePixels = 0;

                // Advanced skin analysis - sample every 8th pixel for better accuracy
                for (let i = 0; i < pixels.length; i += 32) {
                    const r = pixels[i];
                    const g = pixels[i + 1];
                    const b = pixels[i + 2];

                    totalR += r;
                    totalG += g;
                    totalB += b;
                    pixelCount++;

                    // Calculate brightness and luminance
                    const brightness = (r + g + b) / 3;
                    const luminance = 0.299 * r + 0.587 * g + 0.114 * b; // More accurate brightness
                    brightnessSum += luminance;

                    // Calculate saturation using HSV model
                    const max = Math.max(r, g, b);
                    const min = Math.min(r, g, b);
                    const saturation = max === 0 ? 0 : (max - min) / max;
                    saturationSum += saturation;

                    // Advanced redness detection (inflammation/irritation)
                    const redness = r / (g + b + 1); // Ratio-based redness
                    if (redness > 1.3 && r > 120) {
                        inflammationPixels++;
                    }

                    // Traditional redness detection
                    if (r > g + 20 && r > b + 20 && r > 100) {
                        rednessCount++;
                    }

                    // Hydration analysis - dry skin has lower saturation and specific color patterns
                    const hydrationIndex = saturation * (g / (r + 1)) * (luminance / 255);
                    if (hydrationIndex < 0.15 && luminance > 80 && luminance < 200) {
                        dryPatches++;
                    }

                    // Shine detection for oiliness
                    if (luminance > 190 && saturation < 0.25) {
                        shinyPixels++;
                    }

                    // Pore detection (darker spots with specific characteristics)
                    if (luminance < 80 && saturation < 0.3) {
                        porePixels++;
                    }

                    // Texture analysis with multiple neighbors
                    if (i > 64) {
                        const prev1 = (pixels[i - 32] + pixels[i - 31] + pixels[i - 30]) / 3;
                        const prev2 = (pixels[i - 64] + pixels[i - 63] + pixels[i - 62]) / 3;

                        const localVariance = Math.abs(brightness - prev1) + Math.abs(prev1 - prev2);
                        textureVariance += localVariance;

                        // Smooth area detection
                        if (localVariance < 15) {
                            smoothAreas++;
                        }

                        // Contrast analysis
                        if (localVariance > 25) {
                            contrastSum += localVariance;
                        }
                    }
                }

                const avgR = totalR / pixelCount;
                const avgG = totalG / pixelCount;
                const avgB = totalB / pixelCount;
                const avgBrightness = brightnessSum / pixelCount;
                const avgSaturation = saturationSum / pixelCount;

                // Calculate ratios
                const rednessRatio = rednessCount / pixelCount;
                const inflammationRatio = inflammationPixels / pixelCount;
                const dryRatio = dryPatches / pixelCount;
                const shinyRatio = shinyPixels / pixelCount;
                const smoothRatio = smoothAreas / pixelCount;
                const poreRatio = porePixels / pixelCount;
                const textureScore = textureVariance / pixelCount;
                const contrastScore = contrastSum / pixelCount;

                // Advanced hydration calculation
                const moistureIndex = avgSaturation * (avgG / avgR) * (1 - dryRatio);
                const hydrationBase = Math.min(100, moistureIndex * 150);
                const dehydrationPenalty = dryRatio * 80;
                const hydration = Math.max(0, Math.min(100, hydrationBase - dehydrationPenalty + 20));

                // Advanced smoothness calculation
                const textureQuality = Math.max(0, 100 - (textureScore * 2));
                const poreQuality = Math.max(0, 100 - (poreRatio * 300));
                const smoothnessBonus = smoothRatio * 40;
                const smoothness = Math.max(0, Math.min(100,
                    (textureQuality * 0.5) + (poreQuality * 0.3) + (smoothnessBonus * 0.2)
                ));

                // Advanced redness calculation
                const inflammationScore = inflammationRatio * 500;
                const traditionalRedness = rednessRatio * 300;
                const colorBalance = Math.max(0, (avgR - avgG - avgB / 2) * 0.8);
                const redness = Math.min(100, Math.max(0,
                    (inflammationScore * 0.4) + (traditionalRedness * 0.4) + (colorBalance * 0.2)
                ));

                // Enhanced oil detection
                const shineScore = Math.min(100, shinyRatio * 600);
                const brightnessScore = Math.max(0, (avgBrightness - 130) * 1.5);
                const saturationScore = Math.max(0, (0.35 - avgSaturation) * 180);
                const contrastOilScore = Math.min(40, contrastScore * 0.6);

                const oiliness = Math.min(100, Math.max(0,
                    (shineScore * 0.4) +
                    (brightnessScore * 0.3) +
                    (saturationScore * 0.2) +
                    (contrastOilScore * 0.1)
                ));

                return {
                    hydration: Math.round(hydration),
                    smoothness: Math.round(smoothness),
                    redness: Math.round(redness),
                    oiliness: Math.round(oiliness),
                    avgColor: { r: Math.round(avgR), g: Math.round(avgG), b: Math.round(avgB) },
                    brightness: Math.round(avgBrightness),
                    shineRatio: shinyRatio,
                    saturation: avgSaturation,
                    textureScore: textureScore,
                    inflammationRatio: inflammationRatio,
                    dryRatio: dryRatio
                };
            }

            updateSkinDisplayAdvanced(analysis) {
                // Update hydration with color coding
                const hydrationLevel = document.getElementById('hydrationLevel');
                const hydrationBar = document.getElementById('hydrationBar');
                hydrationLevel.textContent = `${analysis.hydration}%`;
                hydrationBar.style.width = `${analysis.hydration}%`;

                // Color coding based on levels
                if (analysis.hydration > 70) {
                    hydrationBar.className = 'bg-gradient-to-r from-blue-400 to-cyan-500 h-3 rounded-full progress-bar shadow-sm';
                } else if (analysis.hydration > 40) {
                    hydrationBar.className = 'bg-gradient-to-r from-blue-400 to-blue-600 h-3 rounded-full progress-bar shadow-sm';
                } else {
                    hydrationBar.className = 'bg-gradient-to-r from-orange-400 to-red-500 h-3 rounded-full progress-bar shadow-sm';
                }

                // Update smoothness with enhanced visualization
                const smoothnessLevel = document.getElementById('smoothnessLevel');
                const smoothnessBar = document.getElementById('smoothnessBar');
                smoothnessLevel.textContent = `${analysis.smoothness}%`;
                smoothnessBar.style.width = `${analysis.smoothness}%`;

                if (analysis.smoothness > 70) {
                    smoothnessBar.className = 'bg-gradient-to-r from-green-400 to-emerald-500 h-3 rounded-full progress-bar shadow-sm';
                } else if (analysis.smoothness > 40) {
                    smoothnessBar.className = 'bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full progress-bar shadow-sm';
                } else {
                    smoothnessBar.className = 'bg-gradient-to-r from-yellow-400 to-orange-500 h-3 rounded-full progress-bar shadow-sm';
                }

                // Update redness with warning levels
                const rednessLevel = document.getElementById('rednessLevel');
                const rednessBar = document.getElementById('rednessBar');
                rednessLevel.textContent = `${analysis.redness}%`;
                rednessBar.style.width = `${analysis.redness}%`;

                if (analysis.redness > 50) {
                    rednessBar.className = 'bg-gradient-to-r from-red-500 to-red-700 h-3 rounded-full progress-bar shadow-sm';
                } else if (analysis.redness > 25) {
                    rednessBar.className = 'bg-gradient-to-r from-orange-400 to-red-500 h-3 rounded-full progress-bar shadow-sm';
                } else {
                    rednessBar.className = 'bg-gradient-to-r from-green-400 to-green-500 h-3 rounded-full progress-bar shadow-sm';
                }

                // Update oiliness with balanced indicators
                const oilLevel = document.getElementById('oilLevel');
                const oilBar = document.getElementById('oilBar');
                oilLevel.textContent = `${analysis.oiliness}%`;
                oilBar.style.width = `${analysis.oiliness}%`;

                if (analysis.oiliness > 70) {
                    oilBar.className = 'bg-gradient-to-r from-yellow-500 to-orange-600 h-3 rounded-full progress-bar shadow-sm';
                } else if (analysis.oiliness > 30) {
                    oilBar.className = 'bg-gradient-to-r from-yellow-400 to-yellow-600 h-3 rounded-full progress-bar shadow-sm';
                } else {
                    oilBar.className = 'bg-gradient-to-r from-green-400 to-green-500 h-3 rounded-full progress-bar shadow-sm';
                }
            }

            updateMoodRecommendationsAdvanced(dominantEmotion, score, confidenceLevel) {
                const recommendations = document.getElementById('recommendations');
                let content = '';

                if (score < 0.3) {
                    content = `
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <h4 class="font-semibold text-gray-800 mb-2">😐 Neutral Expression</h4>
                            <p class="text-sm text-gray-600">Your expression appears neutral. This is perfectly normal!</p>
                            <div class="mt-3 p-3 bg-purple-50 rounded">
                                <h5 class="font-semibold text-purple-700 mb-2">🧘 Recommended Yoga:</h5>
                                <p class="text-sm text-purple-600"><strong>Sun Salutation</strong> - 5 rounds to energize and improve circulation</p>
                                <p class="text-sm text-purple-600"><strong>Mountain Pose</strong> - 2 minutes for grounding and balance</p>
                            </div>
                        </div>
                    `;
                } else {
                    switch (dominantEmotion) {
                        case 'happy':
                            content = `
                                <div class="bg-green-50 p-4 rounded-lg">
                                    <h4 class="font-semibold text-green-800 mb-2">😊 Happy Mood Detected!</h4>
                                    <p class="text-sm text-green-700">Great! Positive emotions can boost your skin's natural glow. Keep smiling!</p>
                                    <div class="mt-3 p-3 bg-purple-50 rounded">
                                        <h5 class="font-semibold text-purple-700 mb-2">🧘 Energizing Yoga:</h5>
                                        <p class="text-sm text-purple-600"><strong>Warrior II</strong> - 1 minute each side for confidence</p>
                                        <p class="text-sm text-purple-600"><strong>Camel Pose</strong> - 30 seconds to open heart chakra</p>
                                        <p class="text-sm text-purple-600"><strong>Dancing Warrior</strong> - Flow for 2 minutes</p>
                                    </div>
                                </div>
                            `;
                            break;
                        case 'sad':
                            content = `
                                <div class="bg-blue-50 p-4 rounded-lg">
                                    <h4 class="font-semibold text-blue-800 mb-2">😢 Feeling Down?</h4>
                                    <p class="text-sm text-blue-700">Consider some self-care: hydrating face mask, gentle skincare routine, or relaxation techniques.</p>
                                    <div class="mt-3 p-3 bg-purple-50 rounded">
                                        <h5 class="font-semibold text-purple-700 mb-2">🧘 Mood-Lifting Yoga:</h5>
                                        <p class="text-sm text-purple-600"><strong>Child's Pose</strong> - 3 minutes for comfort and grounding</p>
                                        <p class="text-sm text-purple-600"><strong>Heart Opening Poses</strong> - Cobra, Fish pose (1 min each)</p>
                                        <p class="text-sm text-purple-600"><strong>Legs Up Wall</strong> - 5 minutes to calm nervous system</p>
                                    </div>
                                </div>
                            `;
                            break;
                        case 'angry':
                            content = `
                                <div class="bg-red-50 p-4 rounded-lg">
                                    <h4 class="font-semibold text-red-800 mb-2">😠 Stress Detected</h4>
                                    <p class="text-sm text-red-700">Stress can affect skin health. Try calming activities and use gentle, soothing skincare products.</p>
                                    <div class="mt-3 p-3 bg-purple-50 rounded">
                                        <h5 class="font-semibold text-purple-700 mb-2">🧘 Calming Yoga:</h5>
                                        <p class="text-sm text-purple-600"><strong>Deep Breathing</strong> - 4-7-8 technique for 5 minutes</p>
                                        <p class="text-sm text-purple-600"><strong>Forward Fold</strong> - 2 minutes to release tension</p>
                                        <p class="text-sm text-purple-600"><strong>Twisted Spinal Pose</strong> - 1 min each side to detox</p>
                                    </div>
                                </div>
                            `;
                            break;
                        case 'surprised':
                            content = `
                                <div class="bg-yellow-50 p-4 rounded-lg">
                                    <h4 class="font-semibold text-yellow-800 mb-2">😲 Surprised!</h4>
                                    <p class="text-sm text-yellow-700">Facial expressions can create temporary lines. Regular moisturizing helps maintain skin elasticity.</p>
                                    <div class="mt-3 p-3 bg-purple-50 rounded">
                                        <h5 class="font-semibold text-purple-700 mb-2">🧘 Balancing Yoga:</h5>
                                        <p class="text-sm text-purple-600"><strong>Tree Pose</strong> - 1 minute each leg for stability</p>
                                        <p class="text-sm text-purple-600"><strong>Cat-Cow Stretch</strong> - 2 minutes for spinal flow</p>
                                        <p class="text-sm text-purple-600"><strong>Alternate Nostril Breathing</strong> - 3 minutes</p>
                                    </div>
                                </div>
                            `;
                            break;
                        case 'fearful':
                            content = `
                                <div class="bg-indigo-50 p-4 rounded-lg">
                                    <h4 class="font-semibold text-indigo-800 mb-2">😰 Anxiety Detected</h4>
                                    <p class="text-sm text-indigo-700">Take deep breaths and try some grounding techniques.</p>
                                    <div class="mt-3 p-3 bg-purple-50 rounded">
                                        <h5 class="font-semibold text-purple-700 mb-2">🧘 Grounding Yoga:</h5>
                                        <p class="text-sm text-purple-600"><strong>Mountain Pose</strong> - 3 minutes for stability</p>
                                        <p class="text-sm text-purple-600"><strong>Warrior I</strong> - 1 minute each side for strength</p>
                                        <p class="text-sm text-purple-600"><strong>Corpse Pose</strong> - 5 minutes for complete relaxation</p>
                                    </div>
                                </div>
                            `;
                            break;
                        default:
                            content = `
                                <div class="bg-gray-50 p-4 rounded-lg">
                                    <h4 class="font-semibold text-gray-800 mb-2">🤖 Analysis Complete</h4>
                                    <p class="text-sm text-gray-600">Mood analysis complete. Check your skin analysis below for personalized recommendations.</p>
                                    <div class="mt-3 p-3 bg-purple-50 rounded">
                                        <h5 class="font-semibold text-purple-700 mb-2">🧘 General Wellness Yoga:</h5>
                                        <p class="text-sm text-purple-600"><strong>Sun Salutation</strong> - 3-5 rounds</p>
                                        <p class="text-sm text-purple-600"><strong>Downward Dog</strong> - 1 minute for circulation</p>
                                    </div>
                                </div>
                            `;
                    }
                }

                recommendations.innerHTML = content;
            }

            updateSkinRecommendationsAdvanced(analysis) {
                const recommendations = document.getElementById('recommendations');
                let skinContent = '';

                // Generate recommendations based on skin analysis
                if (analysis.hydration < 40) {
                    skinContent += `
                        <div class="bg-blue-50 p-4 rounded-lg mt-3">
                            <h4 class="font-semibold text-blue-800 mb-2">💧 Hydration Needed</h4>
                            <p class="text-sm text-blue-700">Your skin appears dehydrated. Use a hydrating serum and drink more water.</p>
                            <div class="mt-2 p-2 bg-purple-50 rounded">
                                <h6 class="font-semibold text-purple-700 text-xs">🧘 Hydrating Yoga:</h6>
                                <p class="text-xs text-purple-600"><strong>Fish Pose</strong> - Opens throat chakra, improves circulation</p>
                                <p class="text-xs text-purple-600"><strong>Shoulder Stand</strong> - Boosts facial blood flow</p>
                            </div>
                        </div>
                    `;
                }

                if (analysis.redness > 30) {
                    skinContent += `
                        <div class="bg-red-50 p-4 rounded-lg mt-3">
                            <h4 class="font-semibold text-red-800 mb-2">🔴 Redness Detected</h4>
                            <p class="text-sm text-red-700">Consider using gentle, anti-inflammatory products with ingredients like niacinamide or green tea.</p>
                            <div class="mt-2 p-2 bg-purple-50 rounded">
                                <h6 class="font-semibold text-purple-700 text-xs">🧘 Anti-Inflammatory Yoga:</h6>
                                <p class="text-xs text-purple-600"><strong>Child's Pose</strong> - Reduces stress-induced inflammation</p>
                                <p class="text-xs text-purple-600"><strong>Cooling Breath</strong> - Sheetali pranayama for 3 minutes</p>
                            </div>
                        </div>
                    `;
                }

                if (analysis.oiliness > 60) {
                    skinContent += `
                        <div class="bg-yellow-50 p-4 rounded-lg mt-3">
                            <h4 class="font-semibold text-yellow-800 mb-2">🛢️ Oily Skin Detected</h4>
                            <p class="text-sm text-yellow-700">Use oil-free moisturizers and consider products with salicylic acid or niacinamide.</p>
                            <div class="mt-2 p-2 bg-purple-50 rounded">
                                <h6 class="font-semibold text-purple-700 text-xs">🧘 Detox Yoga:</h6>
                                <p class="text-xs text-purple-600"><strong>Twisted Triangle</strong> - Stimulates liver detox</p>
                                <p class="text-xs text-purple-600"><strong>Seated Spinal Twist</strong> - Balances hormones</p>
                            </div>
                        </div>
                    `;
                }

                if (analysis.smoothness < 50) {
                    skinContent += `
                        <div class="bg-purple-50 p-4 rounded-lg mt-3">
                            <h4 class="font-semibold text-purple-800 mb-2">✨ Texture Improvement</h4>
                            <p class="text-sm text-purple-700">Consider gentle exfoliation and retinol products to improve skin texture.</p>
                            <div class="mt-2 p-2 bg-purple-50 rounded">
                                <h6 class="font-semibold text-purple-700 text-xs">🧘 Circulation Yoga:</h6>
                                <p class="text-xs text-purple-600"><strong>Downward Dog</strong> - Increases facial blood flow</p>
                                <p class="text-xs text-purple-600"><strong>Cobra Pose</strong> - Opens chest, improves skin tone</p>
                            </div>
                        </div>
                    `;
                }

                if (skinContent) {
                    recommendations.innerHTML += skinContent;
                } else if (recommendations.innerHTML.includes('Analysis Complete')) {
                    recommendations.innerHTML += `
                        <div class="bg-green-50 p-4 rounded-lg mt-3">
                            <h4 class="font-semibold text-green-800 mb-2">✅ Healthy Skin</h4>
                            <p class="text-sm text-green-700">Your skin looks healthy! Maintain your current routine with regular cleansing and moisturizing.</p>
                            <div class="mt-2 p-2 bg-purple-50 rounded">
                                <h6 class="font-semibold text-purple-700 text-xs">🧘 Maintenance Yoga:</h6>
                                <p class="text-xs text-purple-600"><strong>Sun Salutation</strong> - Daily flow for overall wellness</p>
                                <p class="text-xs text-purple-600"><strong>Pranayama</strong> - Deep breathing for skin glow</p>
                            </div>
                        </div>
                    `;
                }
            }

            resetAnalysisDisplay() {
                // Reset mood indicators
                document.querySelectorAll('.mood-indicator').forEach(indicator => {
                    indicator.querySelector('.mood-score').textContent = '0%';
                    indicator.classList.remove('active', 'bg-blue-100', 'border-2', 'border-blue-500');
                });

                // Reset skin metrics
                document.getElementById('hydrationLevel').textContent = '--';
                document.getElementById('hydrationBar').style.width = '0%';
                document.getElementById('smoothnessLevel').textContent = '--';
                document.getElementById('smoothnessBar').style.width = '0%';
                document.getElementById('rednessLevel').textContent = '--';
                document.getElementById('rednessBar').style.width = '0%';
                document.getElementById('oilLevel').textContent = '--';
                document.getElementById('oilBar').style.width = '0%';

                // Reset recommendations
                document.getElementById('recommendations').innerHTML = `
                    <div class="text-center text-gray-500">
                        <div class="text-3xl mb-2">🔍</div>
                        <p>Analysis results will appear here</p>
                    </div>
                `;
            }

            generateAnalysisReport() {
                // Always generate report, even with minimal data
                let meanHydration, meanSmoothness, meanRedness, meanOiliness, dominantMood;

                if (this.analysisHistory.hydration.length === 0) {
                    // No data collected - generate wellness report with estimated values
                    meanHydration = 65; // Default healthy values
                    meanSmoothness = 70;
                    meanRedness = 25;
                    meanOiliness = 45;
                    dominantMood = 'neutral';

                    const report = this.generateWellnessReport(meanHydration, meanSmoothness, meanRedness, meanOiliness, dominantMood);
                    this.displayAnalysisReport(report);
                    this.downloadButton.classList.remove('hidden');
                    return;
                }

                // Calculate mean values from available data
                meanHydration = Math.round(this.analysisHistory.hydration.reduce((a, b) => a + b, 0) / this.analysisHistory.hydration.length);
                meanSmoothness = Math.round(this.analysisHistory.smoothness.reduce((a, b) => a + b, 0) / this.analysisHistory.smoothness.length);
                meanRedness = Math.round(this.analysisHistory.redness.reduce((a, b) => a + b, 0) / this.analysisHistory.redness.length);
                meanOiliness = Math.round(this.analysisHistory.oiliness.reduce((a, b) => a + b, 0) / this.analysisHistory.oiliness.length);

                // Analyze dominant mood
                const moodCounts = {};
                this.analysisHistory.mood.forEach(entry => {
                    if (entry.score > 0.2) { // Lower threshold for better detection
                        moodCounts[entry.emotion] = (moodCounts[entry.emotion] || 0) + 1;
                    }
                });

                dominantMood = Object.keys(moodCounts).length > 0 ?
                    Object.keys(moodCounts).reduce((a, b) => moodCounts[a] > moodCounts[b] ? a : b) :
                    'neutral';

                // Generate comprehensive report
                const report = this.generateComprehensiveReport(meanHydration, meanSmoothness, meanRedness, meanOiliness, dominantMood);

                // Display report and show download button
                this.displayAnalysisReport(report);
                this.downloadButton.classList.remove('hidden');
            }

            generateWellnessReport(hydration, smoothness, redness, oiliness, mood) {
                const report = {
                    skinType: "General Wellness",
                    overallHealth: { score: 75, status: "Good", color: "blue" },
                    sessionType: "wellness",
                    medications: [
                        {
                            condition: "Daily Skin Maintenance",
                            ingredients: ["Hyaluronic Acid", "Vitamin C", "Niacinamide", "SPF"],
                            products: ["CeraVe Daily Moisturizer", "The Ordinary Vitamin C", "Neutrogena SPF 30"],
                            usage: "Apply daily as part of morning and evening routine"
                        }
                    ],
                    yogaPoses: [
                        {
                            category: "Daily Wellness Routine",
                            poses: [
                                {
                                    name: "Sun Salutation (Surya Namaskara)",
                                    duration: "5-10 rounds",
                                    benefits: "Improves circulation, promotes healthy glow, energizes body",
                                    instructions: "Flow through 12 poses, synchronizing with breath"
                                },
                                {
                                    name: "Deep Breathing (Pranayama)",
                                    duration: "5-10 minutes",
                                    benefits: "Oxygenates skin, reduces stress, improves complexion",
                                    instructions: "Sit comfortably, inhale for 4 counts, hold for 4, exhale for 6"
                                },
                                {
                                    name: "Mountain Pose (Tadasana)",
                                    duration: "2-3 minutes",
                                    benefits: "Improves posture, enhances confidence, grounds energy",
                                    instructions: "Stand tall, feet hip-width apart, arms at sides, breathe deeply"
                                }
                            ]
                        },
                        {
                            category: "Skin-Specific Poses",
                            poses: [
                                {
                                    name: "Fish Pose (Matsyasana)",
                                    duration: "1-2 minutes",
                                    benefits: "Increases blood flow to face, opens throat chakra",
                                    instructions: "Lie on back, arch chest, top of head touches ground"
                                },
                                {
                                    name: "Cobra Pose (Bhujangasana)",
                                    duration: "30 seconds, 3 times",
                                    benefits: "Opens chest, improves circulation to face and neck",
                                    instructions: "Lie face down, press palms, lift chest keeping hips down"
                                },
                                {
                                    name: "Legs Up Wall (Viparita Karani)",
                                    duration: "5-10 minutes",
                                    benefits: "Reduces puffiness, calms nervous system, improves lymphatic drainage",
                                    instructions: "Lie with legs up wall, arms relaxed, breathe naturally"
                                },
                                {
                                    name: "Child's Pose (Balasana)",
                                    duration: "3-5 minutes",
                                    benefits: "Reduces stress, calms mind, improves blood flow to head",
                                    instructions: "Kneel, sit back on heels, fold forward with arms extended"
                                }
                            ]
                        }
                    ],
                    lifestyle: [
                        "💧 Drink 8-10 glasses of water daily for optimal hydration",
                        "😴 Maintain 7-9 hours of quality sleep for skin repair",
                        "☀️ Always wear SPF 30+ sunscreen, even indoors",
                        "🧘 Practice 10 minutes of meditation daily for stress reduction",
                        "🚶 Take 30-minute walks in nature for fresh air and exercise",
                        "📱 Clean phone screen regularly to prevent bacteria transfer",
                        "🛏️ Change pillowcases every 2-3 days for cleaner skin contact"
                    ],
                    skincare: {
                        morning: [
                            "🧼 Gentle cleanser with lukewarm water",
                            "🌿 Vitamin C serum for antioxidant protection",
                            "💧 Lightweight moisturizer suitable for your skin type",
                            "☀️ Broad-spectrum SPF 30+ sunscreen"
                        ],
                        evening: [
                            "🧼 Double cleanse (oil cleanser + water-based cleanser)",
                            "💧 Hydrating toner or essence",
                            "🌙 Night moisturizer or sleeping mask",
                            "👁️ Eye cream for delicate under-eye area"
                        ],
                        weekly: [
                            "💧 Hydrating sheet mask (2x per week)",
                            "✨ Gentle exfoliation with AHA/BHA (1x per week)",
                            "🏺 Clay mask for deep cleansing (1x per week)"
                        ]
                    },
                    diet: {
                        include: [
                            "🥒 Water-rich foods: cucumber, watermelon, oranges",
                            "🥑 Healthy fats: avocado, nuts, olive oil, fatty fish",
                            "🫐 Antioxidant-rich foods: berries, leafy greens, dark chocolate",
                            "🍊 Vitamin C foods: citrus fruits, bell peppers, broccoli",
                            "🥕 Beta-carotene foods: carrots, sweet potatoes, spinach",
                            "🍃 Green tea (2-3 cups daily) for anti-inflammatory benefits"
                        ],
                        avoid: [
                            "🍟 Processed and fried foods that can cause inflammation",
                            "🍰 Excessive sugar that can accelerate skin aging",
                            "🥛 Dairy products if you notice skin reactions",
                            "🌶️ Very spicy foods if you have sensitive skin"
                        ],
                        supplements: [
                            "Omega-3 fatty acids for skin hydration",
                            "Vitamin C for collagen production",
                            "Vitamin E for antioxidant protection",
                            "Zinc for skin healing and oil regulation",
                            "Probiotics for gut-skin health connection"
                        ]
                    },
                    metrics: { hydration, smoothness, redness, oiliness, mood }
                };

                return report;
            }

            generateComprehensiveReport(hydration, smoothness, redness, oiliness, mood) {
                const report = {
                    skinType: this.determineSkinType(hydration, oiliness, redness),
                    overallHealth: this.calculateOverallHealth(hydration, smoothness, redness, oiliness),
                    medications: this.recommendMedications(hydration, smoothness, redness, oiliness),
                    yogaPoses: this.recommendYogaPoses(mood, redness, oiliness),
                    lifestyle: this.recommendLifestyle(hydration, smoothness, redness, oiliness, mood),
                    skincare: this.recommendSkincare(hydration, smoothness, redness, oiliness),
                    diet: this.recommendDiet(hydration, smoothness, redness, oiliness),
                    metrics: { hydration, smoothness, redness, oiliness, mood }
                };

                return report;
            }

            determineSkinType(hydration, oiliness, redness) {
                if (oiliness > 60 && hydration > 50) return "Oily";
                if (hydration < 40 && oiliness < 30) return "Dry";
                if (oiliness > 50 && hydration < 50) return "Combination";
                if (redness > 40) return "Sensitive";
                return "Normal";
            }

            calculateOverallHealth(hydration, smoothness, redness, oiliness) {
                const healthScore = (hydration + smoothness + (100 - redness) + (100 - Math.abs(oiliness - 40))) / 4;
                if (healthScore >= 80) return { score: healthScore, status: "Excellent", color: "green" };
                if (healthScore >= 60) return { score: healthScore, status: "Good", color: "blue" };
                if (healthScore >= 40) return { score: healthScore, status: "Fair", color: "yellow" };
                return { score: healthScore, status: "Needs Attention", color: "red" };
            }

            recommendMedications(hydration, smoothness, redness, oiliness) {
                const medications = [];

                if (hydration < 40) {
                    medications.push({
                        condition: "Dehydrated Skin",
                        ingredients: ["Hyaluronic Acid", "Ceramides", "Glycerin"],
                        products: ["Neutrogena Hydra Boost", "CeraVe Daily Moisturizing Lotion", "The Ordinary Hyaluronic Acid 2% + B5"],
                        usage: "Apply twice daily on clean skin"
                    });
                }

                if (redness > 40) {
                    medications.push({
                        condition: "Skin Irritation/Redness",
                        ingredients: ["Niacinamide", "Centella Asiatica", "Aloe Vera", "Green Tea Extract"],
                        products: ["The Ordinary Niacinamide 10% + Zinc 1%", "COSRX Centella Blemish Cream", "Aloe Vera Gel 99%"],
                        usage: "Apply morning and evening, patch test first"
                    });
                }

                if (oiliness > 60) {
                    medications.push({
                        condition: "Excess Oil Production",
                        ingredients: ["Salicylic Acid", "Niacinamide", "Clay Masks", "Retinol"],
                        products: ["Paula's Choice 2% BHA Liquid Exfoliant", "The Ordinary Niacinamide", "Aztec Secret Indian Healing Clay"],
                        usage: "Start with 2-3 times per week, gradually increase"
                    });
                }

                if (smoothness < 50) {
                    medications.push({
                        condition: "Rough Skin Texture",
                        ingredients: ["AHA (Glycolic/Lactic Acid)", "Retinol", "Vitamin C"],
                        products: ["The Ordinary Glycolic Acid 7%", "Differin Gel", "Vitamin C Serum"],
                        usage: "Use AHA at night, start slowly to build tolerance"
                    });
                }

                return medications;
            }

            recommendYogaPoses(mood, redness, oiliness) {
                const poses = [];

                // Stress-reducing poses for redness and inflammation
                if (redness > 30 || mood === 'angry' || mood === 'sad') {
                    poses.push({
                        category: "Stress Relief & Anti-Inflammatory",
                        poses: [
                            {
                                name: "Child's Pose (Balasana)",
                                duration: "2-3 minutes",
                                benefits: "Reduces stress, improves blood circulation to face",
                                instructions: "Kneel on floor, sit back on heels, fold forward with arms extended"
                            },
                            {
                                name: "Legs Up the Wall (Viparita Karani)",
                                duration: "5-10 minutes",
                                benefits: "Reduces facial puffiness, calms nervous system",
                                instructions: "Lie on back with legs up against wall, arms relaxed at sides"
                            },
                            {
                                name: "Fish Pose (Matsyasana)",
                                duration: "1-2 minutes",
                                benefits: "Improves circulation to face and neck",
                                instructions: "Lie on back, arch chest up, top of head touches ground"
                            }
                        ]
                    });
                }

                // Detoxifying poses for oily skin
                if (oiliness > 50) {
                    poses.push({
                        category: "Detoxification & Oil Balance",
                        poses: [
                            {
                                name: "Twisted Triangle (Parivrtta Trikonasana)",
                                duration: "30 seconds each side",
                                benefits: "Stimulates liver detoxification, balances hormones",
                                instructions: "Stand wide, twist torso and reach opposite hand to floor"
                            },
                            {
                                name: "Shoulder Stand (Sarvangasana)",
                                duration: "2-5 minutes",
                                benefits: "Improves circulation, helps regulate oil production",
                                instructions: "Lie on back, lift legs and torso up, support lower back with hands"
                            },
                            {
                                name: "Seated Forward Bend (Paschimottanasana)",
                                duration: "2-3 minutes",
                                benefits: "Calms mind, reduces stress-related oil production",
                                instructions: "Sit with legs extended, fold forward over legs"
                            }
                        ]
                    });
                }

                // General skin health poses
                poses.push({
                    category: "Overall Skin Health",
                    poses: [
                        {
                            name: "Sun Salutation (Surya Namaskara)",
                            duration: "5-10 rounds",
                            benefits: "Improves overall circulation, promotes healthy glow",
                            instructions: "Flow through 12 poses, synchronizing with breath"
                        },
                        {
                            name: "Cobra Pose (Bhujangasana)",
                            duration: "30 seconds, 3 times",
                            benefits: "Opens chest, improves circulation to face",
                            instructions: "Lie face down, press palms down, lift chest up"
                        },
                        {
                            name: "Pranayama (Deep Breathing)",
                            duration: "5-10 minutes",
                            benefits: "Oxygenates skin, reduces stress hormones",
                            instructions: "Sit comfortably, breathe deeply through nose, hold, exhale slowly"
                        }
                    ]
                });

                return poses;
            }

            recommendLifestyle(hydration, smoothness, redness, oiliness, mood) {
                const recommendations = [];

                if (hydration < 50) {
                    recommendations.push("💧 Drink 8-10 glasses of water daily");
                    recommendations.push("🌿 Use a humidifier in your room");
                    recommendations.push("🚿 Take lukewarm showers instead of hot");
                }

                if (redness > 30) {
                    recommendations.push("☀️ Always wear SPF 30+ sunscreen");
                    recommendations.push("🧴 Use fragrance-free products");
                    recommendations.push("❄️ Apply cool compresses for 10 minutes daily");
                }

                if (oiliness > 60) {
                    recommendations.push("🧼 Cleanse face twice daily with gentle cleanser");
                    recommendations.push("📱 Clean your phone screen regularly");
                    recommendations.push("🛏️ Change pillowcases every 2-3 days");
                }

                if (mood === 'sad' || mood === 'angry') {
                    recommendations.push("😴 Maintain 7-9 hours of quality sleep");
                    recommendations.push("🧘 Practice 10 minutes of meditation daily");
                    recommendations.push("🚶 Take 30-minute walks in nature");
                }

                return recommendations;
            }

            recommendSkincare(hydration, smoothness, redness, oiliness) {
                const routine = {
                    morning: [],
                    evening: [],
                    weekly: []
                };

                // Morning routine
                routine.morning.push("🧼 Gentle cleanser");
                if (redness > 30) routine.morning.push("🌿 Soothing toner with niacinamide");
                if (hydration < 50) routine.morning.push("💧 Hydrating serum");
                routine.morning.push("🧴 Moisturizer suitable for your skin type");
                routine.morning.push("☀️ Broad-spectrum SPF 30+");

                // Evening routine
                routine.evening.push("🧼 Double cleanse (oil cleanser + water-based)");
                if (oiliness > 50) routine.evening.push("🧪 BHA exfoliant (2-3x/week)");
                if (smoothness < 50) routine.evening.push("✨ AHA exfoliant (1-2x/week)");
                if (hydration < 50) routine.evening.push("💧 Hydrating essence");
                routine.evening.push("🌙 Night moisturizer or sleeping mask");

                // Weekly treatments
                if (hydration < 50) routine.weekly.push("💧 Hydrating sheet mask (2x/week)");
                if (oiliness > 60) routine.weekly.push("🏺 Clay mask (1x/week)");
                if (redness > 30) routine.weekly.push("🌿 Calming mask with centella (1x/week)");

                return routine;
            }

            recommendDiet(hydration, smoothness, redness, oiliness) {
                const recommendations = {
                    include: [],
                    avoid: [],
                    supplements: []

                };

                if (hydration < 60) {
                    recommendations.include.push("🥒 Water-rich foods: cucumber, watermelon, oranges");
                    recommendations.include.push("🥑 Healthy fats: avocado, nuts, olive oil");
                    recommendations.avoid.push("🌶️ Spicy foods and alcohol");
                    recommendations.avoid.push("☕ Caffeine (dehydrates skin)");
                    recommendations.avoid.push("🍺 Alcohol (worsens dryness)");
                    recommendations.avoid.push("🧂 Excess salt (causes water retention)");
                    recommendations.supplements.push("Omega-3 fatty acids");
                }

                if (redness > 30) {
                    recommendations.include.push("🫐 Anti-inflammatory foods: berries, leafy greens");
                    recommendations.include.push("🐟 Fatty fish: salmon, mackerel, sardines");
                    recommendations.avoid.push("🌶️ Spicy foods and alcohol");
                    recommendations.avoid.push("☕ Caffeine (dehydrates skin)");
                    recommendations.avoid.push("🍺 Alcohol (worsens dryness)");
                    recommendations.avoid.push("🧂 Excess salt (causes water retention)");
                    recommendations.supplements.push("Vitamin E and Zinc");
                }

                if (oiliness > 60) {
                    recommendations.include.push("🥬 Zinc-rich foods: pumpkin seeds, chickpeas");
                    recommendations.include.push("🍃 Green tea (2-3 cups daily)");
                    recommendations.avoid.push("🍟 Fried and processed foods");
                    recommendations.avoid.push("🥛 Dairy products (may increase oil production)");
                    recommendations.supplements.push("Zinc and Probiotics");
                }

                if (smoothness < 50) {
                    recommendations.include.push("🍊 Vitamin C foods: citrus, bell peppers");
                    recommendations.include.push("🥕 Beta-carotene foods: carrots, sweet potatoes");
                    recommendations.supplements.push("Vitamin C and Collagen");
                }

                return recommendations;
            }

            displayAnalysisReport(report) {
                const recommendations = document.getElementById('recommendations');
                this.currentReport = report; // Store for download

                const sessionTypeHeader = report.sessionType === 'wellness' ?
                    `<div class="bg-blue-50 p-3 rounded-lg mb-4 border border-blue-200">
                        <h4 class="font-bold text-blue-800 mb-1">🌟 Wellness Session Report</h4>
                        <p class="text-sm text-blue-700">Short session detected - Generated comprehensive wellness guide with general recommendations</p>
                    </div>` : '';

                const reportHTML = `
                    <div class="space-y-4">
                        ${sessionTypeHeader}
                        
                        <!-- Overall Health Score -->
                        <div class="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
                            <h4 class="font-bold text-blue-800 mb-2">📊 Overall Skin Health: ${report.overallHealth.status}</h4>
                            <div class="w-full bg-gray-200 rounded-full h-3">
                                <div class="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full" style="width: ${report.overallHealth.score}%"></div>
                            </div>
                            <p class="text-sm text-blue-700 mt-2">Score: ${Math.round(report.overallHealth.score)}/100 | Skin Type: ${report.skinType}</p>
                        </div>
                        
                        <!-- Mean Results -->
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <h4 class="font-bold text-gray-800 mb-3">📈 Session Analysis Results</h4>
                            <div class="grid grid-cols-2 gap-3 text-sm">
                                <div>💧 Hydration: <span class="font-bold text-blue-600">${report.metrics.hydration}%</span></div>
                                <div>✨ Smoothness: <span class="font-bold text-green-600">${report.metrics.smoothness}%</span></div>
                                <div>🔴 Redness: <span class="font-bold text-red-600">${report.metrics.redness}%</span></div>
                                <div>🛢️ Oil Level: <span class="font-bold text-yellow-600">${report.metrics.oiliness}%</span></div>
                            </div>
                        </div>
                        
                        <!-- Medications & Ingredients -->
                        <div class="bg-blue-50 p-4 rounded-lg">
                            <h4 class="font-bold text-blue-800 mb-3">💊 Recommended Treatments</h4>
                            ${report.medications.map(med => `
                                <div class="mb-3 p-3 bg-white rounded border">
                                    <h5 class="font-semibold text-blue-700">${med.condition}</h5>
                                    <p class="text-sm text-gray-600 mt-1"><strong>Key Ingredients:</strong> ${med.ingredients.join(', ')}</p>
                                    <p class="text-sm text-gray-600"><strong>Recommended Products:</strong> ${med.products.join(', ')}</p>
                                    <p class="text-sm text-blue-600 mt-1"><strong>Usage:</strong> ${med.usage}</p>
                                </div>
                            `).join('')}
                        </div>
                        
                        <!-- Yoga Recommendations -->
                        <div class="bg-purple-50 p-4 rounded-lg">
                            <h4 class="font-bold text-purple-800 mb-3">🧘 Yoga for Skin Health</h4>
                            ${report.yogaPoses.map(category => `
                                <div class="mb-3">
                                    <h5 class="font-semibold text-purple-700 mb-2">${category.category}</h5>
                                    ${category.poses.map(pose => `
                                        <div class="mb-2 p-2 bg-white rounded border-l-4 border-purple-300">
                                            <h6 class="font-medium text-purple-600">${pose.name}</h6>
                                            <p class="text-xs text-gray-600">${pose.benefits}</p>
                                            <p class="text-xs text-purple-500">Duration: ${pose.duration}</p>
                                        </div>
                                    `).join('')}
                                </div>
                            `).join('')}
                        </div>
                        
                        <!-- Skincare Routine -->
                        <div class="bg-green-50 p-4 rounded-lg">
                            <h4 class="font-bold text-green-800 mb-3">🧴 Personalized Skincare Routine</h4>
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div class="bg-white p-3 rounded">
                                    <h5 class="font-semibold text-green-700 mb-2">🌅 Morning</h5>
                                    ${report.skincare.morning.map(step => `<p class="text-sm text-gray-600">${step}</p>`).join('')}
                                </div>
                                <div class="bg-white p-3 rounded">
                                    <h5 class="font-semibold text-green-700 mb-2">🌙 Evening</h5>
                                    ${report.skincare.evening.map(step => `<p class="text-sm text-gray-600">${step}</p>`).join('')}
                                </div>
                                <div class="bg-white p-3 rounded">
                                    <h5 class="font-semibold text-green-700 mb-2">📅 Weekly</h5>
                                    ${report.skincare.weekly.map(step => `<p class="text-sm text-gray-600">${step}</p>`).join('')}
                                </div>
                            </div>
                        </div>
                        
                        <!-- Diet Recommendations -->
                        <div class="bg-orange-50 p-4 rounded-lg">
                            <h4 class="font-bold text-orange-800 mb-3">🥗 Nutrition for Healthy Skin</h4>
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div class="bg-white p-3 rounded">
                                    <h5 class="font-semibold text-green-700 mb-2">✅ Include</h5>
                                    ${report.diet.include.map(item => `<p class="text-sm text-gray-600">${item}</p>`).join('')}
                                </div>
                                <div class="bg-white p-3 rounded">
                                    <h5 class="font-semibold text-red-700 mb-2">❌ Avoid</h5>
                                    ${report.diet.avoid.map(item => `<p class="text-sm text-gray-600">${item}</p>`).join('')}
                                </div>
                                <div class="bg-white p-3 rounded">
                                    <h5 class="font-semibold text-blue-700 mb-2">💊 Supplements</h5>
                                    ${report.diet.supplements.map(item => `<p class="text-sm text-gray-600">${item}</p>`).join('')}
                                </div>
                            </div>
                        </div>
                        
                        <!-- Lifestyle Tips -->
                        <div class="bg-indigo-50 p-4 rounded-lg">
                            <h4 class="font-bold text-indigo-800 mb-3">🌟 Lifestyle Recommendations</h4>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                                ${report.lifestyle.map(tip => `<p class="text-sm text-gray-600 bg-white p-2 rounded">${tip}</p>`).join('')}
                            </div>
                        </div>
                        
                        <div class="text-center text-xs text-gray-500 mt-4">
                            <p>⚠️ This analysis is for informational purposes only. Consult a dermatologist for serious skin concerns.</p>
                        </div>
                    </div>
                `;

                recommendations.innerHTML = reportHTML;
            }

            downloadReport() {
                if (!this.currentReport) {
                    this.showError('No report available to download');
                    return;
                }

                const report = this.currentReport;
                const currentDate = new Date().toLocaleDateString();
                const currentTime = new Date().toLocaleTimeString();

                const reportContent = `
AI FACIAL & SKIN ANALYSIS REPORT
Generated on: ${currentDate} at ${currentTime}
=====================================

OVERALL ASSESSMENT
------------------
Skin Health Score: ${Math.round(report.overallHealth.score)}/100 (${report.overallHealth.status})
Skin Type: ${report.skinType}
${report.sessionType === 'wellness' ? 'Session Type: Wellness Guide (Short Session)\n' : ''}

ANALYSIS METRICS
----------------
💧 Hydration Level: ${report.metrics.hydration}%
✨ Skin Smoothness: ${report.metrics.smoothness}%
🔴 Redness Level: ${report.metrics.redness}%
🛢️ Oil Production: ${report.metrics.oiliness}%
😊 Dominant Mood: ${report.metrics.mood}

RECOMMENDED TREATMENTS & PRODUCTS
----------------------------------
${report.medications.map(med => `
${med.condition}:
• Key Ingredients: ${med.ingredients.join(', ')}
• Recommended Products: ${med.products.join(', ')}
• Usage: ${med.usage}
`).join('')}

YOGA POSES FOR SKIN HEALTH
---------------------------
${report.yogaPoses.map(category => `
${category.category}:
${category.poses.map(pose => `
• ${pose.name} (${pose.duration})
  Benefits: ${pose.benefits}
  Instructions: ${pose.instructions}
`).join('')}`).join('')}

PERSONALIZED SKINCARE ROUTINE
------------------------------
Morning Routine:
${report.skincare.morning.map(step => `• ${step}`).join('\n')}

Evening Routine:
${report.skincare.evening.map(step => `• ${step}`).join('\n')}

Weekly Treatments:
${report.skincare.weekly.map(step => `• ${step}`).join('\n')}

NUTRITION RECOMMENDATIONS
--------------------------
Foods to Include:
${report.diet.include.map(item => `• ${item}`).join('\n')}

Foods to Avoid:
${report.diet.avoid.map(item => `• ${item}`).join('\n')}

Recommended Supplements:
${report.diet.supplements.map(item => `• ${item}`).join('\n')}

LIFESTYLE RECOMMENDATIONS
--------------------------
${report.lifestyle.map(tip => `• ${tip}`).join('\n')}

IMPORTANT DISCLAIMER
--------------------
This analysis is for informational and wellness purposes only. 
It is not intended to diagnose, treat, cure, or prevent any medical condition.
For serious skin concerns or medical issues, please consult a qualified dermatologist or healthcare professional.

Report generated by AI Facial & Skin Analysis Tool
Visit us for more wellness insights and personalized recommendations.
                `.trim();

                // Create and download the file
                const blob = new Blob([reportContent], { type: 'text/plain' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Skin_Analysis_Report_${new Date().toISOString().split('T')[0]}.txt`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);

                // Show success message
                this.showSuccess('Report downloaded successfully! Check your downloads folder.');
            }

            showSuccess(message) {
                const successDiv = document.createElement('div');
                successDiv.className = 'fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg shadow-lg z-50';
                successDiv.innerHTML = `<strong>Success:</strong> ${message}`;
                document.body.appendChild(successDiv);

                setTimeout(() => {
                    document.body.removeChild(successDiv);
                }, 4000);
            }

            updateCameraStatus(message, color = 'gray') {
                const statusColors = {
                    green: 'bg-emerald-500',
                    yellow: 'bg-amber-500',
                    red: 'bg-red-500',
                    gray: 'bg-gray-400'
                };

                const statusBgColors = {
                    green: 'from-emerald-50 to-green-50 border-emerald-200',
                    yellow: 'from-amber-50 to-yellow-50 border-amber-200',
                    red: 'from-red-50 to-rose-50 border-red-200',
                    gray: 'from-gray-50 to-slate-50 border-gray-200'
                };

                this.cameraStatus.innerHTML = `
                    <div class="status-indicator bg-gradient-to-r ${statusBgColors[color]}">
                        <div class="w-3 h-3 ${statusColors[color]} rounded-full animate-pulse shadow-sm"></div>
                        <span class="text-gray-700 font-medium">${message}</span>
                    </div>
                `;
            }

            showError(message) {
                this.errorText.textContent = message;
                this.errorMessage.classList.remove('hidden');
                setTimeout(() => {
                    this.errorMessage.classList.add('hidden');
                }, 5000);
            }
        }

        // Initialize the app when the page loads
        document.addEventListener('DOMContentLoaded', () => {
            new FacialAnalysisApp();
        });
    