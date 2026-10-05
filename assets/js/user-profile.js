(() => {
  'use strict';

  const form = document.querySelector('#user-profile-form');
  if (!form) return;

  const photoInput = document.querySelector('#profile-photo');
  const photoStatus = document.querySelector('#profile-photo-status');
  const photoRemove = document.querySelector('#profile-photo-remove');
  const avatar = document.querySelector('#profile-avatar');
  const role = document.querySelector('#profile-role');
  const organizationFields = document.querySelectorAll('.profile-organization-field');
  const saveStatus = document.querySelector('#profile-save-status');
  let previewUrl = '';

  const updateOrganizationFields = () => {
    const isOrganizationContext = role.value === 'organization' || role.value === 'review';
    organizationFields.forEach((field) => {
      field.hidden = !isOrganizationContext;
      field.querySelector('input').required =
        isOrganizationContext && role.value === 'organization';
    });
  };

  const releasePreview = () => {
    if (!previewUrl) return;
    URL.revokeObjectURL(previewUrl);
    previewUrl = '';
  };

  const resetPhoto = () => {
    releasePreview();
    avatar.removeAttribute('style');
    avatar.textContent = 'AD';
    photoInput.value = '';
    photoRemove.disabled = true;
    photoStatus.textContent = 'No image selected.';
  };

  role.addEventListener('change', updateOrganizationFields);
  updateOrganizationFields();

  photoInput.addEventListener('change', () => {
    const [file] = photoInput.files;
    if (!file) return;

    const supportedTypes = ['image/png', 'image/jpeg', 'image/gif'];
    if (!supportedTypes.includes(file.type)) {
      resetPhoto();
      photoStatus.textContent = 'Unsupported file type. Choose a PNG, JPEG, or GIF image.';
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      resetPhoto();
      photoStatus.textContent = 'The image exceeds the 10 MB limit.';
      return;
    }

    releasePreview();
    previewUrl = URL.createObjectURL(file);
    avatar.textContent = '';
    avatar.style.backgroundImage = `url("${previewUrl}")`;
    photoRemove.disabled = false;
    photoStatus.textContent = `${file.name} — local preview only; not uploaded.`;
  });

  photoRemove.addEventListener('click', resetPhoto);
  form.addEventListener('reset', () => {
    window.setTimeout(() => {
      resetPhoto();
      updateOrganizationFields();
      saveStatus.textContent = 'Changes are not saved in this demo.';
    }, 0);
  });

  form.addEventListener('input', () => {
    saveStatus.textContent = 'This screen has changes that have not been simulated as saved.';
  });
  form.addEventListener('change', () => {
    saveStatus.textContent = 'This screen has changes that have not been simulated as saved.';
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const invalid = [...form.querySelectorAll('input, select')].find(
      (control) => !control.disabled && !control.checkValidity(),
    );
    if (invalid) {
      invalid.reportValidity();
      invalid.focus();
      return;
    }
    saveStatus.textContent = 'Changes simulated. No information or image was stored or uploaded.';
  });
})();
