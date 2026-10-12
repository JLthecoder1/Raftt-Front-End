(async () => {
  'use strict';
  const B = window.RafttBackend,
    M = window.RafttImageModel;
  const page = window.RafttRoutes?.page;
  if (!B || !M || !['profile.html', 'company-dashboard.html'].includes(page)) return;
  const t = B.t,
    esc = (s) =>
      String(s ?? '').replace(
        /[&<>"']/g,
        (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
      );
  const labels = {
    avatar: t('Foto de perfil', 'Profile photo'),
    logo: t('Logo da empresa', 'Company logo'),
    cover: t('Capa da empresa', 'Company cover'),
  };
  const root = document.createElement('section');
  root.className = 'image-upload-panel';
  root.setAttribute('data-i18n-skip', '');
  const host =
    page === 'profile.html' ? document.querySelector('#identity') : document.querySelector('main');
  if (!host) return;
  host.append(root);
  root.innerHTML = `<h2>${t('Sua identidade visual', 'Your visual identity')}</h2><p class="muted">${t('Prévia e ajuste antes de salvar. JPEG, PNG ou WebP.', 'Preview and adjust before saving. JPEG, PNG or WebP.')}</p>`;
  let activeOps = 0,
    companySelect;
  function operation(active) {
    activeOps += active ? 1 : -1;
    if (companySelect) companySelect.disabled = activeOps > 0;
  }
  async function signed(rule, path) {
    if (!path) return null;
    return B.fail(await B.db.storage.from(rule.bucket).createSignedUrl(path, 3600)).signedUrl;
  }
  function card(kind, subject) {
    const rule = M.rules[kind],
      node = document.createElement('article');
    node.className = 'image-upload-card';
    node.innerHTML = `<h3>${labels[kind]}</h3><p class="image-help">${rule.width} × ${rule.height} px · ${kind === 'cover' ? '16:9' : '1:1'} · ${t('até', 'up to')} ${kind === 'cover' ? 5 : 2} MB<br>${kind === 'logo' ? t('O símbolo será preservado inteiro, com transparência e margens.', 'The entire symbol is preserved, with transparency and padding.') : t('Ajuste o recorte sem distorcer a imagem.', 'Adjust the crop without stretching the image.')}</p>
      <img class="image-preview ${kind === 'cover' ? 'cover' : ''}" alt="${t('Imagem salva', 'Saved image')}" hidden>
      <canvas class="image-preview ${kind === 'cover' ? 'cover' : ''}" width="${rule.width}" height="${rule.height}" aria-label="${t('Prévia da imagem', 'Image preview')}" hidden></canvas>
      <fieldset style="border:0;padding:0;margin:0"><label>${t('Escolher imagem', 'Choose image')}<input type="file" accept="image/jpeg,image/png,image/webp"></label>
      <div class="image-controls" hidden><label>${kind === 'logo' ? t('Tamanho do símbolo', 'Symbol size') : t('Zoom', 'Zoom')}<input class="image-zoom" type="range" min="${kind === 'logo' ? 0.6 : 1}" max="${kind === 'logo' ? 1 : 3}" step=".01" value="1"></label>
      ${kind === 'logo' ? '' : `<label>${t('Posição horizontal', 'Horizontal position')}<input class="image-x" type="range" min="-1" max="1" step=".01" value="0"></label><label>${t('Posição vertical', 'Vertical position')}<input class="image-y" type="range" min="-1" max="1" step=".01" value="0"></label>`}</div>
      <div class="image-upload-actions"><button type="button" class="button image-save" disabled>${t('Salvar imagem', 'Save image')}</button><button type="button" class="button secondary image-cancel" hidden>${t('Descartar ajuste', 'Discard changes')}</button><button type="button" class="button secondary image-remove" hidden>${t('Remover imagem', 'Remove image')}</button></div></fieldset>
      <p class="image-upload-status" role="status" aria-live="polite"></p>`;
    const canvas = node.querySelector('canvas'),
      ctx = canvas.getContext('2d'),
      img = node.querySelector('img'),
      input = node.querySelector('input[type=file]'),
      controls = node.querySelector('.image-controls'),
      save = node.querySelector('.image-save'),
      cancel = node.querySelector('.image-cancel'),
      remove = node.querySelector('.image-remove'),
      status = node.querySelector('[role=status]'),
      fieldset = node.querySelector('fieldset');
    let source = null,
      path = subject[rule.column],
      fileRevision = 0;
    function dispose() {
      source?.close?.();
      source = null;
    }
    function reset() {
      ++fileRevision;
      dispose();
      input.value = '';
      canvas.hidden = true;
      controls.hidden = true;
      save.disabled = true;
      cancel.hidden = true;
      img.hidden = !path;
      remove.hidden = !path;
    }
    function draw() {
      if (!source) return;
      const zoom = Number(node.querySelector('.image-zoom').value),
        x = Number(node.querySelector('.image-x')?.value || 0),
        y = Number(node.querySelector('.image-y')?.value || 0);
      const pos = M.layout(source.width, source.height, kind, zoom, x, y);
      ctx.clearRect(0, 0, rule.width, rule.height);
      if (kind !== 'logo') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, rule.width, rule.height);
      }
      ctx.drawImage(source, pos.x, pos.y, pos.width, pos.height);
    }
    async function current() {
      try {
        const url = await signed(rule, path);
        if (url) {
          img.src = url;
          img.hidden = false;
        }
        remove.hidden = !path;
      } catch {
        status.textContent = t(
          'Não foi possível carregar a imagem salva.',
          'Could not load the saved image.',
        );
      }
    }
    current();
    input.onchange = async () => {
      const file = input.files[0];
      if (!file) return;
      const revision = ++fileRevision;
      status.textContent = '';
      try {
        M.validate(file, kind);
        const bitmap = await createImageBitmap(file);
        if (revision !== fileRevision) {
          bitmap.close();
          return;
        }
        if (bitmap.width * bitmap.height > 40000000) {
          bitmap.close();
          throw Error('pixels');
        }
        if (bitmap.width < rule.width || bitmap.height < rule.height)
          status.textContent = t(
            'Imagem menor que o recomendado; a prévia poderá perder nitidez.',
            'Image smaller than recommended; the preview may lose sharpness.',
          );
        dispose();
        source = bitmap;
        controls
          .querySelectorAll('input')
          .forEach((el) => (el.value = el.classList.contains('image-zoom') ? '1' : '0'));
        draw();
        canvas.hidden = false;
        img.hidden = true;
        controls.hidden = false;
        save.disabled = false;
        cancel.hidden = false;
      } catch (e) {
        reset();
        status.textContent =
          {
            format: t('Use JPEG, PNG ou WebP.', 'Use JPEG, PNG or WebP.'),
            size: t('Arquivo acima do limite indicado.', 'File exceeds the stated limit.'),
            pixels: t(
              'Imagem grande demais. Reduza a resolução antes de enviar.',
              'Image too large. Reduce the resolution before uploading.',
            ),
          }[e.message] || t('Não foi possível abrir a imagem.', 'Could not open the image.');
      }
    };
    controls.querySelectorAll('input').forEach((el) => (el.oninput = draw));
    cancel.onclick = () => {
      reset();
      status.textContent = t(
        'Ajuste descartado. A imagem salva foi mantida.',
        'Changes discarded. Your saved image was kept.',
      );
    };
    async function persist(nextPath) {
      const table = kind === 'avatar' ? 'profiles' : 'companies';
      const result = await B.db
        .from(table)
        .update({ [rule.column]: nextPath })
        .eq('id', subject.id)
        .select('id')
        .single();
      B.fail(result);
      subject[rule.column] = nextPath;
      if (kind === 'avatar') {
        const profile = JSON.parse(localStorage.getItem('raftt-profile') || '{}');
        profile.avatarPath = nextPath;
        localStorage.setItem('raftt-profile', JSON.stringify(profile));
        window.dispatchEvent(new CustomEvent('raftt:avatar-change', { detail: nextPath }));
      }
    }
    save.onclick = async () => {
      if (!source) return;
      fieldset.disabled = true;
      operation(true);
      let newPath,
        committed = false;
      status.textContent = t('Salvando imagem…', 'Saving image…');
      try {
        await B.user();
        const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', 0.9));
        if (!blob || blob.type !== 'image/webp')
          throw Error(
            t(
              'Seu navegador não suporta esta conversão. Use Chrome ou Edge atualizado.',
              'Your browser does not support this conversion. Use an updated Chrome or Edge.',
            ),
          );
        if (blob.size > rule.maxBytes)
          throw Error(
            t('A imagem processada excedeu o limite.', 'Processed image exceeds the limit.'),
          );
        newPath = `${subject.id}/${crypto.randomUUID()}.webp`;
        B.fail(
          await B.db.storage
            .from(rule.bucket)
            .upload(newPath, blob, { contentType: 'image/webp', upsert: false }),
        );
        const previous = path;
        await persist(newPath);
        committed = true;
        path = newPath;
        reset();
        await current();
        if (previous) await B.db.storage.from(rule.bucket).remove([previous]);
        status.textContent = t('Imagem salva na sua conta.', 'Image saved to your account.');
      } catch (e) {
        if (newPath && !committed) await B.db.storage.from(rule.bucket).remove([newPath]);
        status.textContent = t('Não foi possível salvar. ', 'Could not save. ') + e.message;
      } finally {
        fieldset.disabled = false;
        operation(false);
      }
    };
    remove.onclick = async () => {
      if (!path || !confirm(t('Remover esta imagem?', 'Remove this image?'))) return;
      fieldset.disabled = true;
      operation(true);
      try {
        const previous = path;
        await persist(null);
        path = null;
        reset();
        img.removeAttribute('src');
        await B.db.storage.from(rule.bucket).remove([previous]);
        status.textContent = t('Imagem removida.', 'Image removed.');
      } catch (e) {
        status.textContent = t('Não foi possível remover. ', 'Could not remove. ') + e.message;
      } finally {
        fieldset.disabled = false;
        operation(false);
      }
    };
    node.cleanup = reset;
    return node;
  }
  try {
    const user = await B.user();
    if (page === 'profile.html') {
      const p = B.fail(
        await B.db.from('profiles').select('id,avatar_path').eq('id', user.id).single(),
      );
      root.append(card('avatar', p));
    } else {
      const companies = B.fail(
        await B.db
          .from('companies')
          .select('id,name,logo_path,cover_path')
          .eq('owner_id', user.id)
          .order('created_at', { ascending: false }),
      );
      if (!companies.length) {
        root.insertAdjacentHTML(
          'beforeend',
          `<p>${t('Cadastre e envie a apresentação da empresa antes de adicionar logo e capa.', 'Register and submit your company application before adding a logo and cover.')}</p><a class="button secondary" href="/company-application">${t('Cadastrar empresa', 'Register company')}</a>`,
        );
        return;
      }
      const label = document.createElement('label');
      label.textContent = t('Empresa', 'Company');
      companySelect = document.createElement('select');
      companies.forEach((c) => {
        const option = document.createElement('option');
        option.value = c.id;
        option.textContent = c.name;
        companySelect.append(option);
      });
      label.append(companySelect);
      root.append(label);
      const grid = document.createElement('div');
      grid.className = 'image-upload-grid';
      root.append(grid);
      const render = () => {
        const company = companies.find((c) => c.id === companySelect.value);
        grid.querySelectorAll('.image-upload-card').forEach((node) => node.cleanup?.());
        grid.replaceChildren(card('logo', company), card('cover', company));
      };
      companySelect.onchange = render;
      render();
    }
  } catch {
    root.insertAdjacentHTML(
      'beforeend',
      `<p role="status">${esc(t('Não foi possível carregar o editor. Execute também a migração 002_images.sql e atualize a página.', 'Could not load the editor. Also run the 002_images.sql migration and refresh the page.'))}</p>`,
    );
  }
})();
