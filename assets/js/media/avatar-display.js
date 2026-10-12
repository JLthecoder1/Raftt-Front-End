(() => {
  'use strict';
  const B = window.RafttBackend;
  if (!B || !document.querySelector('.avatar,.profile-monogram')) return;
  let generation = 0;
  async function show() {
    const revision = ++generation;
    try {
      const user = await B.user(),
        p = B.fail(await B.db.from('profiles').select('avatar_path').eq('id', user.id).single());
      const url = p.avatar_path
        ? B.fail(await B.db.storage.from('profile-avatars').createSignedUrl(p.avatar_path, 3600))
            .signedUrl
        : null;
      if (revision !== generation) return;
      document
        .querySelectorAll('.account-link .avatar,.account-trigger,.profile-monogram')
        .forEach((el) => {
          if (url) {
            const img = document.createElement('img');
            img.src = url;
            img.alt = B.t('Foto de perfil', 'Profile photo');
            img.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:50%';
            el.replaceChildren(img);
          } else {
            const p = JSON.parse(localStorage.getItem('raftt-profile') || '{}');
            el.textContent = (p.name || 'R').slice(0, 1).toUpperCase();
          }
        });
    } catch {}
  }
  window.addEventListener('raftt:avatar-change', show);
  show();
})();
