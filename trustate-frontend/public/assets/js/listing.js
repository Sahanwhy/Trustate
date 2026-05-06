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
    listingForm?.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const btn = document.getElementById('submitBtn');
        const originalText = btn.innerHTML;
        
        btn.disabled = true;
        btn.innerHTML = 'Submitting...';

        // Simulated API call
        setTimeout(() => {
            alert('Listing submitted successfully for admin approval!');
            btn.innerHTML = '✓ Submitted';
            btn.style.background = 'var(--lf-accent)';
            
            // Redirect back to dashboard after a delay
            setTimeout(() => {
                window.location.href = '../seller/seller_dashboard.html';
            }, 1500);
        }, 2000);
    });

    // ── Shared Listing Logic ──
    window.selectSubtype = function(btn, sub) {
        if (typeof SUBTYPE_CONFIG === 'undefined') return;
        
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

