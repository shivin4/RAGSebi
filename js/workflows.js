// SEBI Portal Workflow Interactions

// Eligibility criteria data
const eligibilityCriteria = {
    portfolio_manager: {
        minNetWorth: 50000000, // 5 crore INR
        requirements: [
            "Minimum Net Worth: ₹5 crore",
            "Principal Officer with 5+ years experience",
            "Compliance Officer qualification",
            "Office infrastructure as per SEBI norms"
        ]
    },
    merchant_banker: {
        minNetWorth: 5000000, // 50 lakh INR
        requirements: [
            "Minimum Net Worth: ₹50 lakh",
            "Qualified Merchant Banker",
            "SEBI registration for key personnel",
            "Office setup in commercial premises"
        ]
    },
    stock_broker: {
        minNetWorth: 500000, // 5 lakh INR
        requirements: [
            "Minimum Net Worth: ₹5 lakh",
            "NISM certification for key personnel",
            "Membership in stock exchange",
            "Proper office infrastructure"
        ]
    },
    depository_participant: {
        minNetWorth: 1000000, // 10 lakh INR
        requirements: [
            "Minimum Net Worth: ₹10 lakh",
            "Depository system connectivity",
            "Qualified technical staff",
            "Secure data management systems"
        ]
    },
    foreign_venture_capital: {
        minNetWorth: 100000000, // 10 crore INR
        requirements: [
            "Minimum Net Worth: ₹10 crore",
            "FEMA compliance",
            "Foreign investment approval",
            "Specialized investment expertise"
        ]
    }
};

// Check eligibility function
function checkEligibility() {
    const intermediaryType = document.getElementById('intermediaryType').value;
    const netWorth = parseFloat(document.getElementById('netWorth').value);
    const resultBox = document.getElementById('eligibilityResult');

    if (!intermediaryType) {
        showResult('Please select an intermediary type', 'error');
        return;
    }

    if (!netWorth || netWorth <= 0) {
        showResult('Please enter a valid net worth amount', 'error');
        return;
    }

    const criteria = eligibilityCriteria[intermediaryType];
    const isEligible = netWorth >= criteria.minNetWorth;

    let resultHTML = `
        <h5>Eligibility Check Results</h5>
        <p><strong>Intermediary Type:</strong> ${intermediaryType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
        <p><strong>Your Net Worth:</strong> ₹${netWorth.toLocaleString('en-IN')}</p>
        <p><strong>Required Net Worth:</strong> ₹${criteria.minNetWorth.toLocaleString('en-IN')}</p>
        <p><strong>Eligibility Status:</strong> <span style="color: ${isEligible ? '#10b981' : '#ef4444'}; font-weight: bold;">${isEligible ? 'ELIGIBLE' : 'NOT ELIGIBLE'}</span></p>
        <h6>Requirements:</h6>
        <ul>
    `;

    criteria.requirements.forEach(req => {
        resultHTML += `<li>${req}</li>`;
    });

    resultHTML += `
        </ul>
        ${isEligible ?
            '<p style="color: #10b981; font-weight: bold;">✅ You meet the basic eligibility criteria. Proceed to the next step.</p>' :
            '<p style="color: #ef4444; font-weight: bold;">❌ You do not meet the minimum net worth requirement. Please review the requirements.</p>'
        }
    `;

    resultBox.innerHTML = resultHTML;
    resultBox.className = `result-box ${isEligible ? '' : 'error'}`;
    resultBox.classList.remove('hidden');
}

// Show result helper function
function showResult(message, type = 'success') {
    const resultBox = document.getElementById('eligibilityResult');
    resultBox.innerHTML = `<h5>${type === 'error' ? 'Error' : 'Success'}</h5><p>${message}</p>`;
    resultBox.className = `result-box ${type === 'error' ? 'error' : ''}`;
    resultBox.classList.remove('hidden');
}

// Start application process
function startApplication() {
    const intermediaryType = document.getElementById('intermediaryType').value;
    const netWorth = parseFloat(document.getElementById('netWorth').value);

    if (!intermediaryType) {
        alert('Please select an intermediary type first');
        return;
    }

    // Simulate application process
    const applicationSteps = [
        'Initializing application form...',
        'Validating eligibility...',
        'Generating application number...',
        'Setting up application workspace...'
    ];

    let stepIndex = 0;
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2000;
    `;

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white;
        padding: 30px;
        border-radius: 12px;
        text-align: center;
        max-width: 400px;
        width: 90%;
    `;

    modalContent.innerHTML = `
        <div style="font-size: 3rem; color: #3b82f6; margin-bottom: 20px;">
            <i class="fas fa-spinner fa-spin"></i>
        </div>
        <h3 style="color: #1e3a8a; margin-bottom: 15px;">Starting Application Process</h3>
        <p id="process-step" style="color: #6b7280; margin-bottom: 20px;">${applicationSteps[0]}</p>
        <div style="width: 100%; height: 4px; background: #e5e7eb; border-radius: 2px; overflow: hidden;">
            <div id="progress-bar" style="width: 0%; height: 100%; background: linear-gradient(90deg, #3b82f6, #1e40af); transition: width 0.5s ease;"></div>
        </div>
    `;

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    const interval = setInterval(() => {
        stepIndex++;
        const progress = (stepIndex / applicationSteps.length) * 100;

        document.getElementById('process-step').textContent = applicationSteps[stepIndex] || 'Process complete!';
        document.getElementById('progress-bar').style.width = `${progress}%`;

        if (stepIndex >= applicationSteps.length) {
            clearInterval(interval);
            setTimeout(() => {
                const applicationNumber = `SEBI-${Date.now()}`;
                modalContent.innerHTML = `
                    <div style="font-size: 3rem; color: #10b981; margin-bottom: 20px;">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <h3 style="color: #1e3a8a; margin-bottom: 15px;">Application Started Successfully!</h3>
                    <p style="color: #6b7280; margin-bottom: 20px;">
                        Your application number: <strong>${applicationNumber}</strong><br>
                        Please save this number for future reference.
                    </p>
                    <div style="display: flex; gap: 10px; justify-content: center;">
                        <button onclick="proceedToApplicationForm('${applicationNumber}', '${intermediaryType}', ${netWorth})" style="
                            background: #3b82f6;
                            color: white;
                            border: none;
                            padding: 12px 24px;
                            border-radius: 6px;
                            cursor: pointer;
                            font-weight: 600;
                        ">Proceed to Application Form</button>
                        <button onclick="this.parentElement.parentElement.parentElement.remove()" style="
                            background: #6b7280;
                            color: white;
                            border: none;
                            padding: 12px 24px;
                            border-radius: 6px;
                            cursor: pointer;
                            font-weight: 600;
                        ">Close</button>
                    </div>
                `;
            }, 500);
        }
    }, 1000);
}

// Proceed to application form after successful initialization
function proceedToApplicationForm(applicationNumber, intermediaryType, netWorth) {
    // Remove the modal
    document.querySelectorAll('[style*="position: fixed"][style*="z-index: 2000"]').forEach(modal => modal.remove());

    // Show application form section
    showApplicationForm(applicationNumber, intermediaryType, netWorth);
}

// Show the application form
function showApplicationForm(applicationNumber, intermediaryType, netWorth) {
    const registrationSection = document.getElementById('registration');

    // Create application form HTML
    const applicationFormHTML = `
        <div class="workflow-step" id="application-form-step">
            <div class="step-header">
                <span class="step-number">📝</span>
                <h3>Application Form - ${intermediaryType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</h3>
            </div>
            <div class="step-content">
                <div class="application-form-container">
                    <div class="application-header">
                        <h4>SEBI Intermediary Registration Application</h4>
                        <p><strong>Application Number:</strong> ${applicationNumber}</p>
                        <p><strong>Intermediary Type:</strong> ${intermediaryType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                        <p><strong>Net Worth Verified:</strong> ₹${netWorth.toLocaleString('en-IN')}</p>
                    </div>

                    <form id="sebiApplicationForm" class="sebi-application-form">
                        <div class="form-section">
                            <h5>📋 Basic Information</h5>
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="entityName">Entity Name *</label>
                                    <input type="text" id="entityName" name="entityName" required>
                                </div>
                                <div class="form-group">
                                    <label for="panNumber">PAN Number *</label>
                                    <input type="text" id="panNumber" name="panNumber" pattern="[A-Z]{5}[0-9]{4}[A-Z]{1}" required>
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="incorporationDate">Date of Incorporation *</label>
                                    <input type="date" id="incorporationDate" name="incorporationDate" required>
                                </div>
                                <div class="form-group">
                                    <label for="registeredAddress">Registered Address *</label>
                                    <textarea id="registeredAddress" name="registeredAddress" rows="3" required></textarea>
                                </div>
                            </div>
                        </div>

                        <div class="form-section">
                            <h5>👥 Key Managerial Personnel</h5>
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="principalOfficer">Principal Officer Name *</label>
                                    <input type="text" id="principalOfficer" name="principalOfficer" required>
                                </div>
                                <div class="form-group">
                                    <label for="complianceOfficer">Compliance Officer Name *</label>
                                    <input type="text" id="complianceOfficer" name="complianceOfficer" required>
                                </div>
                            </div>
                        </div>

                        <div class="form-section">
                            <h5>📊 Financial Information</h5>
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="paidUpCapital">Paid-up Capital (₹) *</label>
                                    <input type="number" id="paidUpCapital" name="paidUpCapital" min="0" required>
                                </div>
                                <div class="form-group">
                                    <label for="netWorthConfirmed">Net Worth (₹) *</label>
                                    <input type="number" id="netWorthConfirmed" name="netWorthConfirmed" value="${netWorth}" readonly>
                                </div>
                            </div>
                        </div>

                        <div class="form-section">
                            <h5>📄 Document Upload</h5>
                            <div class="document-upload-grid">
                                <div class="upload-item">
                                    <label for="incorporationCert">Incorporation Certificate *</label>
                                    <input type="file" id="incorporationCert" name="incorporationCert" accept=".pdf,.jpg,.jpeg,.png" required>
                                </div>
                                <div class="upload-item">
                                    <label for="panCard">PAN Card *</label>
                                    <input type="file" id="panCard" name="panCard" accept=".pdf,.jpg,.jpeg,.png" required>
                                </div>
                                <div class="upload-item">
                                    <label for="addressProof">Address Proof *</label>
                                    <input type="file" id="addressProof" name="addressProof" accept=".pdf,.jpg,.jpeg,.png" required>
                                </div>
                                <div class="upload-item">
                                    <label for="financialStatements">Financial Statements *</label>
                                    <input type="file" id="financialStatements" name="financialStatements" accept=".pdf,.jpg,.jpeg,.png" required>
                                </div>
                            </div>
                        </div>

                        <div class="form-section">
                            <h5>📋 Declaration & Submission</h5>
                            <div class="declaration-section">
                                <label class="checkbox-label">
                                    <input type="checkbox" id="declaration" name="declaration" required>
                                    <span>I hereby declare that all information provided is true and correct to the best of my knowledge.</span>
                                </label>
                            </div>
                        </div>

                        <div class="form-actions">
                            <button type="button" onclick="saveDraft()" class="btn-secondary">Save as Draft</button>
                            <button type="button" onclick="previewApplication()" class="btn-secondary">Preview</button>
                            <button type="submit" class="btn-primary large-btn">Submit Application</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;

    // Insert the application form after the eligibility checker
    const eligibilityStep = registrationSection.querySelector('.workflow-step');
    eligibilityStep.insertAdjacentHTML('afterend', applicationFormHTML);

    // Scroll to the application form
    setTimeout(() => {
        document.getElementById('application-form-step').scrollIntoView({ behavior: 'smooth' });
    }, 500);

    // Add form submission handler
    setTimeout(() => {
        const form = document.getElementById('sebiApplicationForm');
        if (form) {
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                submitApplication(this, applicationNumber);
            });
        }
    }, 100);
}

// Submit application
function submitApplication(form, applicationNumber) {
    // Show submission progress
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Submitting...';
    submitBtn.disabled = true;

    // Simulate submission process
    setTimeout(() => {
        submitBtn.textContent = '✅ Submitted Successfully!';
        submitBtn.style.background = '#10b981';

        // Show success message
        setTimeout(() => {
            const successMessage = document.createElement('div');
            successMessage.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #10b981;
                color: white;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 3000;
                max-width: 400px;
            `;
            successMessage.innerHTML = `
                <h4 style="margin: 0 0 10px 0;">🎉 Application Submitted!</h4>
                <p style="margin: 0 0 15px 0;">Your application has been successfully submitted to SEBI.</p>
                <p style="margin: 0; font-size: 0.9rem;">
                    <strong>Application Number:</strong> ${applicationNumber}<br>
                    <strong>Status:</strong> Under Review<br>
                    <strong>Next Steps:</strong> Check email for verification requirements
                </p>
            `;
            document.body.appendChild(successMessage);

            // Auto-remove after 10 seconds
            setTimeout(() => {
                if (successMessage.parentNode) {
                    successMessage.remove();
                }
            }, 10000);
        }, 1000);
    }, 2000);
}

// Save draft functionality
function saveDraft() {
    const formData = new FormData(document.getElementById('sebiApplicationForm'));
    const draftData = {};

    for (let [key, value] of formData.entries()) {
        draftData[key] = value;
    }

    // Store in localStorage
    localStorage.setItem('sebiApplicationDraft', JSON.stringify(draftData));

    // Show success message
    const saveBtn = document.querySelector('button[onclick="saveDraft()"]');
    const originalText = saveBtn.textContent;
    saveBtn.textContent = '✅ Draft Saved!';
    saveBtn.style.background = '#10b981';

    setTimeout(() => {
        saveBtn.textContent = originalText;
        saveBtn.style.background = '';
    }, 2000);
}

// Preview application
function previewApplication() {
    const form = document.getElementById('sebiApplicationForm');
    const formData = new FormData(form);

    let previewHTML = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1e3a8a; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">Application Preview</h2>
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
    `;

    for (let [key, value] of formData.entries()) {
        if (value && key !== 'declaration') {
            const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            previewHTML += `<p><strong>${label}:</strong> ${value}</p>`;
        }
    }

    previewHTML += `
            </div>
            <p style="color: #6b7280; font-size: 0.9rem;">
                This is a preview of your application. Click "Submit Application" to proceed with submission.
            </p>
        </div>
    `;

    // Create preview modal
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2500;
    `;

    modal.innerHTML = `
        <div style="background: white; padding: 30px; border-radius: 12px; max-width: 700px; width: 90%; max-height: 80vh; overflow-y: auto;">
            ${previewHTML}
            <div style="text-align: center; margin-top: 20px;">
                <button onclick="this.parentElement.parentElement.remove()" style="
                    background: #6b7280;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 6px;
                    cursor: pointer;
                    margin-right: 10px;
                ">Close Preview</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

// Reporting tabs functionality
function showReportingTab(tabName) {
    // Hide all tab contents
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => content.classList.remove('active'));

    // Remove active class from all buttons
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(button => button.classList.remove('active'));

    // Show selected tab content
    const selectedTab = document.getElementById(`${tabName}-reporting`);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }

    // Add active class to clicked button
    event.target.classList.add('active');
}

// Make functions globally accessible
window.checkEligibility = checkEligibility;
window.startApplication = startApplication;
window.showReportingTab = showReportingTab;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Workflows.js loaded and functions made globally accessible');

    // Set default active tab
    const defaultTab = document.querySelector('.tab-btn.active');
    if (defaultTab) {
        const tabName = defaultTab.textContent.toLowerCase().replace(' ', '_');
        showReportingTab(tabName);
    }

    // Add smooth scrolling to navigation links
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);

            if (targetSection) {
                targetSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });

                // Update active nav link
                navLinks.forEach(navLink => navLink.classList.remove('active'));
                this.classList.add('active');
            }
        });
    });

    // Add animation to workflow steps on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Initially hide workflow steps and observe them
    const workflowSteps = document.querySelectorAll('.workflow-step');
    workflowSteps.forEach(step => {
        step.style.opacity = '0';
        step.style.transform = 'translateY(30px)';
        step.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(step);
    });

    // Add hover effects to process steps
    const processSteps = document.querySelectorAll('.process-step');
    processSteps.forEach(step => {
        step.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
        });

        step.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });

    // Add click effects to requirement items
    const requirementItems = document.querySelectorAll('.requirement-item');
    requirementItems.forEach(item => {
        item.addEventListener('click', function() {
            this.style.transform = 'scale(0.98)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 150);
        });
    });
});
