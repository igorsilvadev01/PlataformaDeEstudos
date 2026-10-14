// Browser DOM parsing accepts equivalent HTML (quotes, whitespace, casing).
export function checkPractice(source, checks) {
  const document = new DOMParser().parseFromString(source, 'text/html');
  return checks.map(check => {
    const nodes = [...document.querySelectorAll(check.selector)];
    const matches = nodes.filter(node => {
      if (check.nonempty && !node.textContent.trim()) return false;
      if (check.text && node.textContent.trim() !== check.text) return false;
      if (check.attribute && (node.getAttribute(check.attribute) || '').trim().toLowerCase() !== check.value.toLowerCase()) return false;
      if (check.source && !new RegExp(check.source, 'i').test(source.replace(/<!--[\s\S]*?-->/g, ''))) return false;
      if (check.cssSelector) {
        const sheet = new CSSStyleSheet();
        try { sheet.replaceSync(node.textContent); } catch { return false; }
        return [...sheet.cssRules].some(rule => rule.selectorText?.split(',').map(s => s.trim()).includes(check.cssSelector) && rule.style?.getPropertyValue(check.property).trim().toLowerCase() === check.value.toLowerCase());
      }
      return true;
    });
    const passed = matches.length >= (check.count || 1);
    let hint;
    if (!passed) {
      if (nodes.length < (check.count || 1)) hint = `Encontrei ${nodes.length} elemento(s) que correspondem a “${check.selector}”; este objetivo precisa de ${check.count || 1}. Confira as tags, os atributos e onde cada elemento foi colocado.`;
      else if (check.cssSelector) hint = `No elemento style, confira a regra ${check.cssSelector}: a propriedade ${check.property} deve ter o valor ${check.value}. Use chaves e separe a propriedade do valor com :.`;
      else if (check.attribute) hint = `Confira o atributo ${check.attribute} em “${check.selector}”. O valor esperado é “${check.value}”.`;
      else if (check.text) hint = `O texto de “${check.selector}” deve ser “${check.text}”. Confira as letras, os espaços e a pontuação.`;
      else if (check.nonempty) hint = `O elemento “${check.selector}” precisa ter conteúdo. Escreva o texto entre a tag de abertura e a de fechamento.`;
      else hint = `Confira a declaração exigida por este objetivo no seu HTML: ${check.label}.`;
    }
    return { label: check.label, passed, hint };
  });
}

export function previewDocument(source) {
  const document = new DOMParser().parseFromString(source, 'text/html');
  // Keep practice local: no scripts, remote assets, nested frames or navigation.
  document.querySelectorAll('script, iframe, object, embed, base, link, meta[http-equiv]').forEach(node => node.remove());
  document.querySelectorAll('a, area').forEach(node => node.removeAttribute('href'));
  document.querySelectorAll('form').forEach(node => { node.removeAttribute('action'); node.removeAttribute('target'); });
  const policy = document.createElement('meta');
  policy.httpEquiv = 'Content-Security-Policy';
  policy.content = "default-src 'none'; img-src data:; style-src 'unsafe-inline'; form-action 'none'; base-uri 'none'";
  document.head.prepend(policy);
  return '<!doctype html>' + document.documentElement.outerHTML;
}
