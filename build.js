// Element SDK Configuration
        const defaultConfig = {
            app_title: "Step-by-Step Resume Builder",
            app_subtitle: "Build Your Professional Resume in Minutes"
        };

        async function onConfigChange(config) {
            const title = document.getElementById('appTitle');
            const subtitle = document.getElementById('appSubtitle');
            
            if (title) title.textContent = config.app_title || defaultConfig.app_title;
            if (subtitle) subtitle.textContent = config.app_subtitle || defaultConfig.app_subtitle;
        }

        function mapToCapabilities(config) {
            return {
                recolorables: [],
                borderables: [],
                fontEditable: undefined,
                fontSizeable: undefined
            };
        }

        function mapToEditPanelValues(config) {
            return new Map([
                ["app_title", config.app_title || defaultConfig.app_title],
                ["app_subtitle", config.app_subtitle || defaultConfig.app_subtitle]
            ]);
        }

        if (window.elementSdk) {
            window.elementSdk.init({
                defaultConfig,
                onConfigChange,
                mapToCapabilities,
                mapToEditPanelValues
            });
        }

        // Resume Builder State
        let currentTemplate = null;
        let currentSlide = 0;
        let formData = {};

        const templates = [
            { id: 'professional', name: '📋 Professional', icon: '📋' },
            { id: 'modern', name: '✨ Modern', icon: '✨' },
            { id: 'creative', name: '🎨 Creative', icon: '🎨' },
            { id: 'minimal', name: '📝 Minimal', icon: '📝' }
        ];

        const slides = [
            {
                title: '👤 Personal Information',
                subtitle: 'Let\'s start with your basic details',
                icon: '👤',
                fields: [
                    { id: 'fullName', label: 'Full Name', type: 'text', placeholder: 'John Doe', required: true },
                    { id: 'email', label: 'Email Address', type: 'email', placeholder: 'john@example.com', required: true },
                    { id: 'phone', label: 'Phone Number', type: 'tel', placeholder: '+1 (555) 123-4567', required: true },
                    { id: 'location', label: 'Location', type: 'text', placeholder: 'City, State', required: true }
                ]
            },
            {
                title: '🎯 Career Objective',
                subtitle: 'Describe your professional goals',
                icon: '🎯',
                fields: [
                    { id: 'objective', label: 'Career Objective', type: 'textarea', placeholder: 'Enter a brief summary of your professional goals and aspirations...', required: true, hint: 'Keep it concise and focused on your target role' }
                ]
            },
            {
                title: '⚡ Skills',
                subtitle: 'List your key skills and competencies',
                icon: '⚡',
                fields: [
                    { id: 'skills', label: 'Your Skills', type: 'textarea', placeholder: 'Python, Project Management, Communication, Data Analysis\n(Enter each skill separated by a new line)', required: true, hint: 'Press Enter after each skill' }
                ]
            },
            {
                title: '🎓 Education',
                subtitle: 'Add your educational qualifications',
                icon: '🎓',
                fields: [
                    { id: 'education', label: 'Education Details', type: 'textarea', placeholder: 'B.Tech in Computer Science, XYZ University (2018-2022)\nIntermediate, ABC School (2016-2018)\n(Enter each qualification on a new line)', required: true, hint: 'One qualification per line' }
                ]
            },
            {
                title: '💼 Work Experience',
                subtitle: 'Describe your professional experience',
                icon: '💼',
                fields: [
                    { id: 'experience', label: 'Work Experience', type: 'textarea', placeholder: 'Senior Developer at Tech Corp (2022-Present)\nResponsible for leading development team and implementing new features\n\nJunior Developer at StartUp Inc (2020-2022)\nDeveloped web applications using React and Node.js\n(Separate each role with a blank line)', required: true, hint: 'Use blank lines to separate different roles' }
                ]
            },
            {
                title: '🎯 Additional Info',
                subtitle: 'Complete your resume with extra details',
                icon: '🎯',
                fields: [
                    { id: 'certifications', label: 'Certifications (Optional)', type: 'textarea', placeholder: 'AWS Certified Solutions Architect\nGoogle Cloud Professional Data Engineer\n(Enter each certification on a new line)', hint: 'One certification per line' },
                    { id: 'interests', label: 'Interests & Hobbies (Optional)', type: 'textarea', placeholder: 'Machine Learning, Open Source Development, Mentoring\n(Enter each interest separated by a new line)', hint: 'One interest per line' }
                ]
            }
        ];

        // Initialize
        function init() {
            renderTemplates();
            renderSlides();
        }

        // Render templates
        function renderTemplates() {
            const grid = document.getElementById('templateGrid');
            grid.innerHTML = templates.map(template => `
                <div class="template-card" onclick="selectTemplate('${template.id}')">
                    <div class="template-icon">${template.icon}</div>
                    <div class="template-name">${template.name}</div>
                </div>
            `).join('');
        }

        // Select template
        function selectTemplate(id) {
            currentTemplate = id;
            currentSlide = 0;
            formData = {};

            // Update UI
            document.querySelectorAll('.template-card').forEach(card => {
                card.classList.remove('selected');
            });
            event.currentTarget.classList.add('selected');

            // Show form
            document.getElementById('templateSection').style.display = 'none';
            document.getElementById('progressSection').style.display = 'block';
            document.getElementById('slideContainer').style.display = 'block';
            document.getElementById('buttonGroup').style.display = 'flex';

            showSlide(0);
            updatePreview();
        }

        // Render slides
        function renderSlides() {
            const container = document.getElementById('slideContainer');
            container.innerHTML = slides.map((slide, index) => `
                <div class="slide" data-slide="${index}">
                    <div class="slide-title">
                        <span>${slide.icon}</span>
                        <span>${slide.title}</span>
                    </div>
                    <div class="slide-subtitle">${slide.subtitle}</div>
                    ${slide.fields.map(field => `
                        <div class="form-group">
                            <label for="${field.id}">${field.label}${field.required ? '<span style="color: #e74c3c;">*</span>' : ''}</label>
                            ${field.type === 'textarea' ? `
                                <textarea 
                                    id="${field.id}" 
                                    placeholder="${field.placeholder}"
                                    oninput="formData['${field.id}'] = this.value; updatePreview();"
                                ></textarea>
                            ` : `
                                <input 
                                    type="${field.type}" 
                                    id="${field.id}" 
                                    placeholder="${field.placeholder}"
                                    oninput="formData['${field.id}'] = this.value; updatePreview();"
                                />
                            `}
                            ${field.hint ? `<div class="hint-text">💡 ${field.hint}</div>` : ''}
                        </div>
                    `).join('')}
                </div>
            `).join('');
        }

        // Show slide
        function showSlide(index) {
            const slides = document.querySelectorAll('.slide');
            slides.forEach(slide => slide.classList.remove('active'));
            slides[index].classList.add('active');

            // Update progress
            document.getElementById('progressText').textContent = slides[index].querySelector('.slide-title span:last-child').textContent;
            document.getElementById('progressCount').textContent = `${index + 1} of ${slides.length}`;
            document.getElementById('progressFill').style.width = `${((index + 1) / slides.length) * 100}%`;

            // Update buttons
            const prevBtn = document.getElementById('prevBtn');
            const nextBtn = document.getElementById('nextBtn');

            prevBtn.disabled = index === 0;
            
            if (index === slides.length - 1) {
                nextBtn.textContent = '✨ Complete Resume';
                nextBtn.onclick = completeResume;
            } else {
                nextBtn.textContent = 'Next →';
                nextBtn.onclick = nextSlide;
            }

            // Populate form fields
            slides[index].querySelectorAll('input, textarea').forEach(input => {
                if (formData[input.id]) {
                    input.value = formData[input.id];
                }
            });
        }

        // Next slide
        function nextSlide() {
            const slides = document.querySelectorAll('.slide');
            if (currentSlide < slides.length - 1) {
                currentSlide++;
                showSlide(currentSlide);
            }
        }

        // Previous slide
        function previousSlide() {
            if (currentSlide > 0) {
                currentSlide--;
                showSlide(currentSlide);
            }
        }

        // Complete resume
        function completeResume() {
            const resumePreview = document.getElementById('resumePreview');
            
            resumePreview.innerHTML = `
                <div class="completion-screen">
                    <div class="completion-icon">🎉</div>
                    <div class="completion-title">Resume Complete!</div>
                    <div class="completion-text">Your resume has been created successfully with the ${currentTemplate} template.</div>
                    <button class="download-button" onclick="downloadResume()">📥 Download as PDF</button>
                    <button class="btn-secondary" onclick="startOver()" style="margin-left: 12px; display: inline-block; padding: 16px 40px;">↻ Start Over</button>
                </div>
            `;
        }

        // Download resume
        function downloadResume() {
            const element = document.getElementById('resumePreview');
            const html = element.innerHTML;
            
            // Create a new window and print
            const printWindow = window.open('', '', 'height=600,width=800');
            printWindow.document.write(`
                <html>
                <head>
                    <title>Resume</title>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; }
                        .resume-header { text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #333; }
                        .resume-name { font-size: 1.8rem; font-weight: bold; margin-bottom: 4px; }
                        .resume-section-title { font-size: 1.1rem; font-weight: bold; margin-top: 16px; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
                    </style>
                </head>
                <body>${generatePlainTextResume()}</body>
                </html>
            `);
            printWindow.document.close();
            
            setTimeout(() => {
                printWindow.print();
            }, 250);
        }

        // Generate plain text resume based on template
        function generatePlainTextResume() {
            if (currentTemplate === 'professional') {
                return generateProfessionalTemplate();
            } else if (currentTemplate === 'modern') {
                return generateModernTemplate();
            } else if (currentTemplate === 'creative') {
                return generateCreativeTemplate();
            } else if (currentTemplate === 'minimal') {
                return generateMinimalTemplate();
            }
        }

        // Professional Template - Classic Corporate Style
        function generateProfessionalTemplate() {
            return `
                <div style="max-width: 800px; margin: 0 auto; font-family: 'Times New Roman', serif;">
                    <div style="text-align: center; margin-bottom: 20px; border-bottom: 3px solid #000; padding-bottom: 15px;">
                        <div style="font-size: 2rem; font-weight: bold; margin-bottom: 5px;">${formData.fullName || 'YOUR NAME'}</div>
                        <div style="font-size: 0.95rem; letter-spacing: 1px;">
                            ${formData.email || 'email@example.com'} • ${formData.phone || '+1 (555) 123-4567'} • ${formData.location || 'City, State'}
                        </div>
                    </div>

                    ${formData.objective ? `
                        <div style="margin-bottom: 18px;">
                            <div style="font-size: 1.1rem; font-weight: bold; text-transform: uppercase; margin-bottom: 8px; border-bottom: 1px solid #000; padding-bottom: 4px;">Professional Summary</div>
                            <div style="white-space: pre-wrap; line-height: 1.6; font-size: 0.95rem;">${formData.objective}</div>
                        </div>
                    ` : ''}

                    ${formData.experience ? `
                        <div style="margin-bottom: 18px;">
                            <div style="font-size: 1.1rem; font-weight: bold; text-transform: uppercase; margin-bottom: 8px; border-bottom: 1px solid #000; padding-bottom: 4px;">Professional Experience</div>
                            <div style="white-space: pre-wrap; line-height: 1.6; font-size: 0.95rem;">${formData.experience}</div>
                        </div>
                    ` : ''}

                    ${formData.education ? `
                        <div style="margin-bottom: 18px;">
                            <div style="font-size: 1.1rem; font-weight: bold; text-transform: uppercase; margin-bottom: 8px; border-bottom: 1px solid #000; padding-bottom: 4px;">Education</div>
                            <ul style="margin: 0; padding-left: 20px;">
                                ${formData.education.split('\n').filter(e => e.trim()).map(edu => `<li style="margin-bottom: 4px; font-size: 0.95rem;">${edu.trim()}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}

                    ${formData.skills ? `
                        <div style="margin-bottom: 18px;">
                            <div style="font-size: 1.1rem; font-weight: bold; text-transform: uppercase; margin-bottom: 8px; border-bottom: 1px solid #000; padding-bottom: 4px;">Core Skills</div>
                            <div style="font-size: 0.95rem;">${formData.skills.split('\n').filter(s => s.trim()).join(' • ')}</div>
                        </div>
                    ` : ''}

                    ${formData.certifications ? `
                        <div style="margin-bottom: 18px;">
                            <div style="font-size: 1.1rem; font-weight: bold; text-transform: uppercase; margin-bottom: 8px; border-bottom: 1px solid #000; padding-bottom: 4px;">Certifications</div>
                            <ul style="margin: 0; padding-left: 20px;">
                                ${formData.certifications.split('\n').filter(c => c.trim()).map(cert => `<li style="margin-bottom: 4px; font-size: 0.95rem;">${cert.trim()}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}

                    ${formData.interests ? `
                        <div>
                            <div style="font-size: 1.1rem; font-weight: bold; text-transform: uppercase; margin-bottom: 8px; border-bottom: 1px solid #000; padding-bottom: 4px;">Interests</div>
                            <div style="font-size: 0.95rem;">${formData.interests.split('\n').filter(i => i.trim()).join(', ')}</div>
                        </div>
                    ` : ''}
                </div>
            `;
        }

        // Modern Template - Contemporary Design with Sidebar
        function generateModernTemplate() {
            return `
                <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
                    <!-- Sidebar -->
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px;">
                        <div style="font-size: 1.4rem; font-weight: bold; margin-bottom: 20px; word-break: break-word;">${(formData.fullName || 'YOUR NAME').split(' ')[0]}</div>

                        ${formData.location ? `
                            <div style="margin-bottom: 20px; font-size: 0.9rem;">
                                <div style="font-weight: bold; margin-bottom: 4px; opacity: 0.8;">LOCATION</div>
                                <div>${formData.location}</div>
                            </div>
                        ` : ''}

                        ${formData.phone ? `
                            <div style="margin-bottom: 20px; font-size: 0.9rem; word-break: break-all;">
                                <div style="font-weight: bold; margin-bottom: 4px; opacity: 0.8;">PHONE</div>
                                <div>${formData.phone}</div>
                            </div>
                        ` : ''}

                        ${formData.email ? `
                            <div style="margin-bottom: 20px; font-size: 0.9rem; word-break: break-all;">
                                <div style="font-weight: bold; margin-bottom: 4px; opacity: 0.8;">EMAIL</div>
                                <div>${formData.email}</div>
                            </div>
                        ` : ''}

                        ${formData.skills ? `
                            <div style="font-size: 0.9rem;">
                                <div style="font-weight: bold; margin-bottom: 8px; opacity: 0.8; text-transform: uppercase;">Skills</div>
                                ${formData.skills.split('\n').filter(s => s.trim()).map(skill => `
                                    <div style="margin-bottom: 6px; padding: 4px 8px; background: rgba(255,255,255,0.2); border-radius: 4px; font-size: 0.85rem;">✓ ${skill.trim()}</div>
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>

                    <!-- Main Content -->
                    <div style="padding: 30px; font-family: 'Segoe UI', sans-serif;">
                        <div style="font-size: 2rem; font-weight: bold; margin-bottom: 4px;">${formData.fullName || 'YOUR NAME'}</div>

                        ${formData.objective ? `
                            <div style="margin-bottom: 24px; color: #666; line-height: 1.6;">${formData.objective}</div>
                        ` : ''}

                        ${formData.experience ? `
                            <div style="margin-bottom: 24px;">
                                <div style="font-size: 1.2rem; font-weight: bold; margin-bottom: 12px; color: #667eea;">PROFESSIONAL EXPERIENCE</div>
                                <div style="white-space: pre-wrap; line-height: 1.7; color: #333; font-size: 0.95rem;">${formData.experience}</div>
                            </div>
                        ` : ''}

                        ${formData.education ? `
                            <div style="margin-bottom: 24px;">
                                <div style="font-size: 1.2rem; font-weight: bold; margin-bottom: 12px; color: #667eea;">EDUCATION</div>
                                ${formData.education.split('\n').filter(e => e.trim()).map(edu => `
                                    <div style="margin-bottom: 8px; color: #333; font-size: 0.95rem;">• ${edu.trim()}</div>
                                `).join('')}
                            </div>
                        ` : ''}

                        ${formData.certifications ? `
                            <div style="margin-bottom: 24px;">
                                <div style="font-size: 1.2rem; font-weight: bold; margin-bottom: 12px; color: #667eea;">CERTIFICATIONS</div>
                                ${formData.certifications.split('\n').filter(c => c.trim()).map(cert => `
                                    <div style="margin-bottom: 8px; color: #333; font-size: 0.95rem;">• ${cert.trim()}</div>
                                `).join('')}
                            </div>
                        ` : ''}

                        ${formData.interests ? `
                            <div>
                                <div style="font-size: 1.2rem; font-weight: bold; margin-bottom: 12px; color: #667eea;">INTERESTS</div>
                                <div style="color: #333; font-size: 0.95rem;">${formData.interests.split('\n').filter(i => i.trim()).join(', ')}</div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }

        // Creative Template - Colorful Design with Highlights
        function generateCreativeTemplate() {
            return `
                <div style="font-family: 'Arial', sans-serif; padding: 20px;">
                    <!-- Header Section -->
                    <div style="background: linear-gradient(45deg, #FF6B6B, #4ECDC4, #FFD93D); padding: 30px; border-radius: 12px; margin-bottom: 30px; position: relative; overflow: hidden;">
                        <div style="position: absolute; top: -20px; right: -20px; width: 100px; height: 100px; background: rgba(255,255,255,0.2); border-radius: 50%;"></div>
                        <div style="position: relative; z-index: 1;">
                            <div style="font-size: 2.2rem; font-weight: bold; color: white; margin-bottom: 8px; text-shadow: 2px 2px 4px rgba(0,0,0,0.2);">${formData.fullName || 'YOUR NAME'}</div>
                            <div style="color: white; font-size: 0.95rem; text-shadow: 1px 1px 2px rgba(0,0,0,0.2);">
                                📧 ${formData.email || 'email@example.com'} • 📱 ${formData.phone || '+1 (555) 123-4567'} • 📍 ${formData.location || 'City, State'}
                            </div>
                        </div>
                    </div>

                    ${formData.objective ? `
                        <div style="margin-bottom: 24px; padding: 18px; background: #f0f4ff; border-left: 4px solid #FF6B6B; border-radius: 6px;">
                            <div style="font-size: 1.1rem; font-weight: bold; margin-bottom: 8px; color: #333;">🎯 Professional Objective</div>
                            <div style="white-space: pre-wrap; line-height: 1.6; color: #555; font-size: 0.95rem;">${formData.objective}</div>
                        </div>
                    ` : ''}

                    <!-- Two Column Layout -->
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                        <!-- Left Column -->
                        <div>
                            ${formData.experience ? `
                                <div style="margin-bottom: 24px; padding: 18px; background: #fff0f5; border-left: 4px solid #4ECDC4; border-radius: 6px;">
                                    <div style="font-size: 1.1rem; font-weight: bold; margin-bottom: 12px; color: #333;">💼 Experience</div>
                                    <div style="white-space: pre-wrap; line-height: 1.6; color: #555; font-size: 0.9rem;">${formData.experience}</div>
                                </div>
                            ` : ''}

                            ${formData.education ? `
                                <div style="padding: 18px; background: #fffaf0; border-left: 4px solid #FFD93D; border-radius: 6px;">
                                    <div style="font-size: 1.1rem; font-weight: bold; margin-bottom: 12px; color: #333;">🎓 Education</div>
                                    ${formData.education.split('\n').filter(e => e.trim()).map(edu => `
                                        <div style="margin-bottom: 8px; color: #555; font-size: 0.9rem;">✓ ${edu.trim()}</div>
                                    `).join('')}
                                </div>
                            ` : ''}
                        </div>

                        <!-- Right Column -->
                        <div>
                            ${formData.skills ? `
                                <div style="margin-bottom: 24px; padding: 18px; background: #f0fff4; border-left: 4px solid #6C5CE7; border-radius: 6px;">
                                    <div style="font-size: 1.1rem; font-weight: bold; margin-bottom: 12px; color: #333;">⚡ Skills</div>
                                    <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                                        ${formData.skills.split('\n').filter(s => s.trim()).map(skill => `
                                            <span style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 6px 12px; border-radius: 20px; font-size: 0.85rem; font-weight: 600;">${skill.trim()}</span>
                                        `).join('')}
                                    </div>
                                </div>
                            ` : ''}

                            ${formData.certifications ? `
                                <div style="padding: 18px; background: #f5f5ff; border-left: 4px solid #A29BFE; border-radius: 6px;">
                                    <div style="font-size: 1.1rem; font-weight: bold; margin-bottom: 12px; color: #333;">🏆 Certifications</div>
                                    ${formData.certifications.split('\n').filter(c => c.trim()).map(cert => `
                                        <div style="margin-bottom: 8px; color: #555; font-size: 0.9rem;">⭐ ${cert.trim()}</div>
                                    `).join('')}
                                </div>
                            ` : ''}
                        </div>
                    </div>

                    ${formData.interests ? `
                        <div style="margin-top: 24px; padding: 18px; background: linear-gradient(135deg, #E0C3FC 0%, #8EC5FC 100%); border-radius: 6px; text-align: center;">
                            <div style="font-size: 1rem; font-weight: bold; color: #333; margin-bottom: 8px;">🌟 Interests & Hobbies</div>
                            <div style="color: #333; font-size: 0.95rem;">${formData.interests.split('\n').filter(i => i.trim()).join(' • ')}</div>
                        </div>
                    ` : ''}
                </div>
            `;
        }

        // Minimal Template - Clean Monochrome Style
        function generateMinimalTemplate() {
            return `
                <div style="font-family: 'Courier New', monospace; color: #000; line-height: 1.8;">
                    ╔════════════════════════════════════════════════════════════════╗
                    ║ ${(formData.fullName || 'YOUR NAME').padEnd(62)} ║
                    ╚════════════════════════════════════════════════════════════════╝

                    ${formData.email || 'email@example.com'} | ${formData.phone || '+1 (555) 123-4567'} | ${formData.location || 'City, State'}

                    ─────────────────────────────────────────────────────────────────

                    ${formData.objective ? `
                        PROFESSIONAL OBJECTIVE
                        ${formData.objective.split('\n').map(line => line.trim() ? '  ' + line.trim() : '').join('\n')}

                    ` : ''}

                    ${formData.experience ? `
                        PROFESSIONAL EXPERIENCE
                        ${formData.experience.split('\n').map(line => line.trim() ? '  ' + line.trim() : '').join('\n')}

                    ` : ''}

                    ${formData.education ? `
                        EDUCATION
                        ${formData.education.split('\n').filter(e => e.trim()).map(edu => '  ▪ ' + edu.trim()).join('\n')}

                    ` : ''}

                    ${formData.skills ? `
                        SKILLS
                        ${formData.skills.split('\n').filter(s => s.trim()).map(skill => '  ▪ ' + skill.trim()).join('\n')}

                    ` : ''}

                    ${formData.certifications ? `
                        CERTIFICATIONS
                        ${formData.certifications.split('\n').filter(c => c.trim()).map(cert => '  ▪ ' + cert.trim()).join('\n')}

                    ` : ''}

                    ${formData.interests ? `
                        INTERESTS
                        ${formData.interests.split('\n').filter(i => i.trim()).map(interest => '  ▪ ' + interest.trim()).join('\n')}
                    ` : ''}

                    ─────────────────────────────────────────────────────────────────
                </div>
            `;
        }

        // Update preview
        function updatePreview() {
            const resumePreview = document.getElementById('resumePreview');
            
            if (!currentTemplate) return;

            resumePreview.className = `resume-preview template-${currentTemplate}`;
            resumePreview.innerHTML = generatePlainTextResume();
        }

        // Start over
        function startOver() {
            currentTemplate = null;
            currentSlide = 0;
            formData = {};

            document.getElementById('templateSection').style.display = 'block';
            document.getElementById('progressSection').style.display = 'none';
            document.getElementById('slideContainer').style.display = 'none';
            document.getElementById('buttonGroup').style.display = 'none';

            document.querySelectorAll('.template-card').forEach(card => {
                card.classList.remove('selected');
            });

            document.getElementById('resumePreview').innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📄</div>
                    <p>Select a template to begin building your resume</p>
                </div>
            `;
        }

        // Initialize on load
        init();