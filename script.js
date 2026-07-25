pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

    let registeredUsers = JSON.parse(localStorage.getItem('registeredUsers')) || [];
    let currentUser = null;
    let resumeAnalyses = JSON.parse(localStorage.getItem('resumeAnalyses')) || [];
    let currentAnalysis = null;
    let preUploadJobDetails = {};

    // Initialize Data SDK
    async function initDataSDK() {
      const handler = {
        onDataChanged(data) {
          console.log('Data updated:', data);
        }
      };
      
      if (window.dataSdk) {
        await window.dataSdk.init(handler);
      }
    }

    // Auth Functions
    function switchTab(tab) {
      const loginForm = document.getElementById('login-form');
      const registerForm = document.getElementById('register-form');
      const tabs = document.querySelectorAll('.tab-btn');
      
      tabs.forEach(t => t.classList.remove('active'));
      event.target.classList.add('active');
      
      if (tab === 'login') {
        loginForm.classList.add('active');
        registerForm.classList.remove('active');
      } else {
        registerForm.classList.add('active');
        loginForm.classList.remove('active');
      }
      clearAuthMessage();
    }

    function togglePassword(inputId) {
      const input = document.getElementById(inputId);
      const btn = event.target;
      if (input.type === 'password') {
        input.type = 'text';
        btn.textContent = '🙈';
      } else {
        input.type = 'password';
        btn.textContent = '👁️';
      }
    }

    function showAuthMessage(message, isError = false) {
      const msgEl = document.getElementById('auth-message');
      msgEl.textContent = message;
      msgEl.className = `auth-message ${isError ? 'error' : 'success'}`;
    }

    function clearAuthMessage() {
      const msgEl = document.getElementById('auth-message');
      msgEl.className = 'auth-message';
      msgEl.textContent = '';
    }

    function handleRegister(e) {
      e.preventDefault();
      const name = document.getElementById('register-name').value;
      const email = document.getElementById('register-email').value;
      const password = document.getElementById('register-password').value;
      const confirm = document.getElementById('register-confirm').value;

      if (password !== confirm) {
        showAuthMessage('Passwords do not match!', true);
        return;
      }

      if (registeredUsers.some(u => u.email === email)) {
        showAuthMessage('Email already registered!', true);
        return;
      }

      registeredUsers.push({ name, email, password });
      localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));
      showAuthMessage('Account created! Please login.', false);
      
      setTimeout(() => {
        document.querySelector('.tab-btn').click();
      }, 1000);
    }

    function handleLogin(e) {
      e.preventDefault();
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;

      const user = registeredUsers.find(u => u.email === email && u.password === password);
      
      if (user) {
        currentUser = user;
        showAuthMessage('Login successful!', false);
        setTimeout(() => {
          document.getElementById('auth-container').classList.add('hidden');
          document.getElementById('main-content').classList.add('show');
          document.getElementById('user-email-display').textContent = user.name;
          loadUserHistory();
          initDataSDK();
        }, 500);
      } else {
        showAuthMessage('Invalid email or password!', true);
      }
    }

    function handleLogout() {
      currentUser = null;
      document.getElementById('auth-container').classList.remove('hidden');
      document.getElementById('main-content').classList.remove('show');
      document.getElementById('results-section').classList.remove('show');
      document.getElementById('resume-history').classList.remove('show');
      document.getElementById('login-email').value = '';
      document.getElementById('login-password').value = '';
      clearAuthMessage();
    }

    // Load user's previous analyses
    function loadUserHistory() {
      const userAnalyses = resumeAnalyses.filter(a => a.user_email === currentUser.email);
      const historyEl = document.getElementById('resume-history');
      const listEl = document.getElementById('history-list');
      
      if (userAnalyses.length === 0) {
        historyEl.classList.remove('show');
        return;
      }

      historyEl.classList.add('show');
      listEl.innerHTML = userAnalyses.map((analysis, idx) => `
        <div class="history-card">
          <div class="history-card-header">
            <span class="history-card-title">${analysis.file_name}</span>
            <span class="history-card-score">${analysis.ats_score}/100</span>
          </div>
          <div class="history-card-date">${new Date(analysis.analysis_date).toLocaleDateString()}</div>
          <div class="history-card-details">
            ${analysis.job_title ? `<strong>Position:</strong> ${analysis.job_title}<br>` : ''}
            <strong>Email:</strong> ${analysis.extracted_email}<br>
            <strong>Skills Found:</strong> ${analysis.skills_found}
          </div>
          <button onclick="viewAnalysis(${idx})" style="margin-top: 12px; padding: 8px 16px; background: #16697a; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600;">View & Edit</button>
        </div>
      `).join('');
    }

    function viewAnalysis(idx) {
      const userAnalyses = resumeAnalyses.filter(a => a.user_email === currentUser.email);
      currentAnalysis = userAnalyses[idx];
      displayAnalysisResults(currentAnalysis);
      document.getElementById('results-section').classList.add('show');
      window.scrollTo(0, 0);
    }

    // File Upload
    function handleDragOver(e) {
      e.preventDefault();
      document.getElementById('upload-box').classList.add('dragover');
    }

    function handleDragLeave(e) {
      e.preventDefault();
      document.getElementById('upload-box').classList.remove('dragover');
    }

    function handleDrop(e) {
      e.preventDefault();
      document.getElementById('upload-box').classList.remove('dragover');
      const file = e.dataTransfer.files[0];
      if (file && file.type === 'application/pdf') {
        processFile(file);
      }
    }

    function handleFileSelect(e) {
      const file = e.target.files[0];
      if (file) {
        processFile(file);
      }
    }

    async function processFile(file) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          fullText += textContent.items.map(item => item.str).join(' ') + ' ';
        }

        analyzeResume(fullText, file.name);
      } catch (error) {
        alert('Error processing PDF');
      }
    }

    function analyzeResume(text, fileName) {
      const textLower = text.toLowerCase();
      let score = 50;

      // Extract Contact Info
      const emailRegex = /[\w.-]+@[\w.-]+\.\w+/i;
      const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
      
      const email = text.match(emailRegex)?.[0] || '—';
      const phone = text.match(phoneRegex)?.[0] || '—';

      // Skills Detection
      const skills = ['javascript', 'python', 'java', 'react', 'node.js', 'sql', 'aws', 'docker', 'git', 'typescript', 'css', 'html', 'angular', 'vue', 'mongodb', 'kubernetes'];
      const foundSkills = skills.filter(s => textLower.includes(s));
      
      if (foundSkills.length >= 8) score += 20;
      else if (foundSkills.length >= 4) score += 10;
      else score += 5;

      // Check for sections
      const sections = ['experience', 'education', 'skills', 'summary'];
      const foundSections = sections.filter(s => textLower.includes(s));
      score += foundSections.length * 5;

      // Check contact info
      if (email !== '—') score += 10;
      if (phone !== '—') score += 5;
      if (textLower.includes('linkedin')) score += 5;

      // Personal pronouns
      const pronouns = text.match(/\b(I|me|my|myself)\b/gi) || [];
      if (pronouns.length > 10) score -= 5;

      // Action verbs
      const verbs = ['led', 'developed', 'managed', 'created', 'implemented', 'designed'];
      const foundVerbs = verbs.filter(v => textLower.includes(v));
      if (foundVerbs.length >= 3) score += 5;

      score = Math.min(Math.max(score, 0), 100);

      // Generate recommendations
      const issues = [];
      const recommendations = [];

      if (email === '—') {
        issues.push('Missing email address');
        recommendations.push('Add a professional email at the top');
      }
      if (phone === '—') {
        issues.push('Missing phone number');
        recommendations.push('Include a phone number');
      }
      if (!textLower.includes('linkedin')) {
        issues.push('No LinkedIn profile');
        recommendations.push('Add your LinkedIn profile URL');
      }
      if (foundSkills.length < 3) {
        issues.push('Few technical skills detected');
        recommendations.push('Add more relevant skills and keywords');
      }
      if (foundSections.length < 3) {
        issues.push('Missing standard sections');
        recommendations.push('Use clear headers: Experience, Education, Skills');
      }
      if (pronouns.length > 10) {
        issues.push('Too many personal pronouns');
        recommendations.push('Replace "I/me" with action verbs');
      }

      currentAnalysis = {
        user_email: currentUser.email,
        file_name: fileName,
        ats_score: score,
        analysis_date: new Date().toISOString(),
        extracted_email: email,
        extracted_phone: phone,
        extracted_location: '—',
        skills_found: foundSkills.join(', ') || 'None detected',
        issues_found: issues.join('; '),
        recommendations: recommendations.join('; '),
        job_title: '',
        job_description: '',
        company_name: ''
      };

      displayAnalysisResults(currentAnalysis);
      document.getElementById('results-section').classList.add('show');
    }

    function displayAnalysisResults(analysis) {
      // Hide job details section
      document.querySelector('.job-details-section').style.display = 'none';

      // Display results
      document.getElementById('ats-score').textContent = analysis.ats_score;
      document.getElementById('score-message').textContent = analysis.ats_score >= 80 ? 'Excellent! Very ATS-friendly' : analysis.ats_score >= 60 ? 'Good foundation' : 'Needs improvement';
      
      document.getElementById('result-email').textContent = analysis.extracted_email;
      document.getElementById('result-phone').textContent = analysis.extracted_phone;
      document.getElementById('result-location').textContent = analysis.extracted_location;

      const skillsList = document.getElementById('skills-list');
      const skillsArray = analysis.skills_found.split(', ').filter(s => s);
      skillsList.innerHTML = skillsArray.length > 0 ? skillsArray.map(s => `<span class="skill-tag">${s}</span>`).join('') : '<span class="skill-tag">No skills detected</span>';

      const issuesList = document.getElementById('issues-list');
      const issuesArray = analysis.issues_found.split('; ').filter(s => s);
      issuesList.innerHTML = issuesArray.length > 0 ? issuesArray.map(i => `<div class="issue-item">• ${i}</div>`).join('') : '<div class="recommendation-item">✓ No major issues</div>';

      const recList = document.getElementById('recommendations-list');
      const recsArray = analysis.recommendations.split('; ').filter(s => s);
      recList.innerHTML = recsArray.length > 0 ? recsArray.map(r => `<div class="recommendation-item">→ ${r}</div>`).join('') : '<div class="recommendation-item">Your resume looks great!</div>';
    }

    // Job Details Modal
    function autoSaveJobDetails() {
      preUploadJobDetails = {
        job_title: document.getElementById('pre-job-title').value,
        company_name: document.getElementById('pre-company-name').value,
        job_description: document.getElementById('pre-job-description').value
      };
    }

    function openJobDetailsModal() {
      document.getElementById('job-details-modal').classList.add('show');
    }

    function closeJobDetailsModal() {
      document.getElementById('job-details-modal').classList.remove('show');
    }

    async function saveJobDetails(e) {
      e.preventDefault();
      
      const jobTitle = document.getElementById('job-title').value;
      const jobDesc = document.getElementById('job-description').value;
      const companyName = document.getElementById('company-name').value;

      if (currentAnalysis) {
        currentAnalysis.job_title = jobTitle;
        currentAnalysis.job_description = jobDesc;
        currentAnalysis.company_name = companyName;

        resumeAnalyses.push(currentAnalysis);
        localStorage.setItem('resumeAnalyses', JSON.stringify(resumeAnalyses));

        // Save to Data SDK
        if (window.dataSdk) {
          try {
            await window.dataSdk.create(currentAnalysis);
          } catch (err) {
            console.log('Data SDK save initiated');
          }
        }

        showJobSuccess();
      }
    }

    function showJobSuccess() {
      const section = document.querySelector('.build-resume-section');
      const originalContent = section.innerHTML;
      
      section.innerHTML = `
        <div style="text-align: center; padding: 40px 20px;">
          <div style="font-size: 60px; margin-bottom: 20px;">✓</div>
          <h3 style="font-size: 24px; color: #0f4c75; margin-bottom: 15px;">Analysis Saved!</h3>
          <p style="color: #999; margin-bottom: 25px;">Your resume analysis has been saved to your profile.</p>
          <button onclick="resetAfterSave()" class="btn-build-resume">Start New Analysis</button>
        </div>
      `;
    }

    function resetAfterSave() {
      document.getElementById('results-section').classList.remove('show');
      document.querySelector('.job-details-section').style.display = 'block';
      document.getElementById('resume-file').value = '';
      document.getElementById('upload-box').classList.remove('hidden');
      loadUserHistory();
      window.scrollTo(0, 0);
      
      // Reset the forms
      document.getElementById('pre-upload-job-form').reset();
      document.getElementById('inline-job-form').reset();
      const section = document.querySelector('.build-resume-section');
      section.innerHTML = `
        <h3 style="margin-bottom: 15px; color: #0f4c75;">Tell Us About the Job</h3>
        <p style="color: #999; margin-bottom: 25px; font-size: 14px;">Help us tailor your resume to the specific position</p>
        <form id="inline-job-form" onsubmit="saveJobDetails(event)" style="max-width: 800px; margin: 0 auto;">
         <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
          <div class="form-group" style="margin-bottom: 0;">
           <label>Job Title</label>
           <input type="text" id="job-title" placeholder="e.g., Senior React Developer" required>
          </div>
          <div class="form-group" style="margin-bottom: 0;">
           <label>Company Name</label>
           <input type="text" id="company-name" placeholder="e.g., Acme Corp" required>
          </div>
         </div>
         <div class="form-group">
          <label>Job Description (paste key requirements)</label>
          <textarea id="job-description" placeholder="Paste the job description or key requirements..." required style="min-height: 150px;"></textarea>
         </div>
         <button type="submit" class="btn-build-resume" style="margin-top: 20px;">Build Your Resume</button>
        </form>
      `;
    }