/* ================================================================
   Trustate — listing.js
   Logic for property listing forms
   ================================================================ */

(function initListing() {
    'use strict';

    // ── State & District Data (Sample) ──
    const STATES_DATA = {
        'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Thane', 'Nashik'],
        'Karnataka': ['Bengaluru', 'Mysuru', 'Hubballi', 'Mangaluru', 'Belagavi'],
        'Delhi': ['New Delhi', 'North Delhi', 'South Delhi', 'East Delhi', 'West Delhi'],
        'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem'],
        'West Bengal': ['Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri']
    };

    // ── Elements ──
    const stateSelect = document.getElementById('stateSelect');
    const districtSelect = document.getElementById('districtSelect');
    const listingForm = document.getElementById('listingForm');
    const progressFill = document.querySelector('.lf-progress-fill');

    // ── Initialize State Select ──
    if (stateSelect) {
        Object.keys(STATES_DATA).forEach(state => {
            const opt = document.createElement('option');
            opt.value = state;
            opt.textContent = state;
            stateSelect.appendChild(opt);
        });

        stateSelect.addEventListener('change', function() {
            const state = this.value;
            districtSelect.innerHTML = '<option value="">Select district</option>';
            
            if (state && STATES_DATA[state]) {
                STATES_DATA[state].forEach(dist => {
                    const opt = document.createElement('option');
                    opt.value = dist;
                    opt.textContent = dist;
                    districtSelect.appendChild(opt);
                });
                districtSelect.disabled = false;
            } else {
                districtSelect.disabled = true;
            }
            updateProgress();
        });
    }

    // ── Section Toggling ──
    document.querySelectorAll('.lf-section-head').forEach(head => {
        head.addEventListener('click', () => {
            const section = head.parentElement;
            section.classList.toggle('collapsed');
        });
    });

    // ── Progress Tracking ──
    function updateProgress() {
        if (!listingForm || !progressFill) return;

        const inputs = listingForm.querySelectorAll('input[required], select[required], textarea[required]');
        let filled = 0;
        
        inputs.forEach(input => {
            if (input.type === 'radio') {
                const name = input.name;
                const checked = listingForm.querySelector(`input[name="${name}"]:checked`);
                if (checked) filled++;
            } else if (input.value.trim() !== '') {
                filled++;
            }
        });

        const total = inputs.length;
        const percent = total > 0 ? (filled / total) * 100 : 0;
        progressFill.style.width = percent + '%';
    }

    // Attach listeners for progress
    listingForm?.addEventListener('input', updateProgress);
    listingForm?.addEventListener('change', updateProgress);

    // ── Upload Previews ──
    window.initUploadZones = function() {
        document.querySelectorAll('.lf-upload input[type="file"]').forEach(input => {
            input.addEventListener('change', function(e) {
                const preview = this.parentElement.querySelector('.lf-upload-preview');
                if (!preview) return;
                
                preview.innerHTML = '';
                const files = e.target.files;
                
                for (let i = 0; i < Math.min(files.length, 5); i++) {
                    const reader = new FileReader();
                    reader.onload = function(event) {
                        const img = document.createElement('img');
                        img.src = event.target.result;
                        preview.appendChild(img);
                    };
                    reader.readAsDataURL(files[i]);
                }
                updateProgress();
            });
        });
    };

    // ── Form Submission ──
    listingForm?.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const btn = document.getElementById('submitBtn');
        const originalText = btn.innerHTML;
        
        // Get the selected subtype
        const selectedSubtypeBtn = document.querySelector('.lf-subtype-pill.selected');
        if (!selectedSubtypeBtn) {
            alert('Please select a property type first.');
            return;
        }
        
        // Find the subtype key from SUBTYPE_CONFIG
        let subtype = '';
        for (const [key, config] of Object.entries(window.SUBTYPE_CONFIG || {})) {
            if (config.label === selectedSubtypeBtn.textContent.split(' ').slice(1).join(' ')) {
                subtype = key;
                break;
            }
        }
        // Fallback: If not found by label, we might need a better way. 
        // Let's modify selectSubtype to store the current subtype.
        subtype = window.currentSubtype; 

        btn.disabled = true;
        btn.innerHTML = 'Submitting...';

        const formData = new FormData(listingForm);
        formData.append('subtype', subtype);

        const token = localStorage.getItem('Trustate_token');
        if (!token) {
            alert('Session expired. Please login again.');
            window.location.href = '../auth/login.html';
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/api/properties/residential', {
                method: 'POST',
                headers: {
                    'x-auth-token': token
                },
                body: formData // Send FormData directly
            });

            const contentType = response.headers.get('content-type');
            let result;
            if (contentType && contentType.includes('application/json')) {
                result = await response.json();
            } else {
                const text = await response.text();
                console.error('Non-JSON response:', text);
                throw new Error(`Server returned ${response.status}: ${response.statusText}. Please check backend logs.`);
            }

            if (response.ok) {
                btn.innerHTML = '✓ Submitted';
                btn.style.background = 'var(--lf-accent)';
                alert(result.message || 'Listing submitted successfully!');
                
                setTimeout(() => {
                    window.location.href = '../seller/seller_dashboard.html';
                }, 1500);
            } else {
                throw new Error(result.message || 'Submission failed');
            }
        } catch (error) {
            console.error('Submission error:', error);
            alert('Error: ' + error.message);
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    });

    // ── Shared Listing Logic ──
    window.selectSubtype = function(btn, sub) {
        if (typeof SUBTYPE_CONFIG === 'undefined') return;
        
        window.currentSubtype = sub; // Store the current subtype globally
        document.querySelectorAll('.lf-subtype-pill').forEach(p => p.classList.remove('selected'));
        btn.classList.add('selected');
        
        const cfg = SUBTYPE_CONFIG[sub];
        if (!cfg) return;

        const iconEl = document.getElementById('subtypeIcon');
        const tagEl = document.getElementById('subtypeTag');
        const fieldsEl = document.getElementById('subtypeFields');
        const formEl = document.getElementById('listingForm');

        if (iconEl) iconEl.textContent = cfg.icon;
        if (tagEl) tagEl.textContent = cfg.label;
        if (fieldsEl) fieldsEl.innerHTML = cfg.fields;
        
        if (formEl) {
            formEl.style.display = 'block';
            formEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        
        initUploadZones();
        updateProgress();
    };

    window.resetForm = function() {
        const formEl = document.getElementById('listingForm');
        if (formEl) formEl.style.display = 'none';
        document.querySelectorAll('.lf-subtype-pill').forEach(p => p.classList.remove('selected'));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Initial call
    initUploadZones();
    updateProgress();

    // Export to global for inline scripts
    window.updateProgress = updateProgress;

})();

