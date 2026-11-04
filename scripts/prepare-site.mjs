import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return [full];
  });
}

const files = walk(root).filter((file) => file.endsWith(".html"));
let changed = 0;
for (const file of files) {
  const relative = path.relative(root, file).split(path.sep).join("/");
  const before = fs.readFileSync(file, "utf8");
  let html = before;

  html = html.replace(/<!--\s*This site was created in Webflow\.[\s\S]*?-->/gi, "");
  html = html.replace(/<meta\b[^>]*\bname=["']generator["'][^>]*\/?>/gi, "");
  html = html.replace(/\sdata-wf-domain=["'][^"']*["']/gi, "");
  html = html.replace(/ ?Webflow HTML website template/gi, "");
  html = html.replace(/href=["']mailto:["']/gi, 'href="/contact.html"');
  html = html.replace(/<a\b(?=[^>]*href=["']\/contact\.html["'])(?=[^>]*class=["'][^"']*cta-info-link)[^>]*>/gi, (tag) =>
    /\baria-label=/.test(tag) ? tag : tag.replace(/>$/, ' aria-label="Contact FutureMinds">')
  );

  html = html.replace(
    /<div class=["']contact-card-link-wrap["']>\s*<a\b[^>]*href=["']tel:\+1124561234["'][^>]*>[\s\S]*?<\/a>\s*<\/div>/gi,
    '<div class="contact-card-link-wrap"><a href="#wf-form-Contact-Form-2" class="contact-card-link">Use the enquiry form below</a></div>'
  );
  html = html.replace(/<div class=["']line["']><\/div>\s*(?=<a\b[^>]*href=["']tel:)/gi, "");
  html = html.replace(/<a\b[^>]*href=["']tel:[^"']+["'][^>]*>[\s\S]*?<\/a>/gi, "");

  html = html.replace(/placeholder=["']hello@gmail\.com["']/gi, 'placeholder="Your email address"');
  html = html.replace(/placeholder=["']\+1 \(800\) 555-0147["']/gi, 'placeholder="Your phone number (optional)"');
  html = html.replace(/placeholder=["']\+1 \(415\) 555-0198["']/gi, 'placeholder="Your phone number (optional)"');
  html = html.replace(/(<input\b[^>]*name=["'](?:Phone-Number|Cta-Phone)["'][^>]*?)\srequired=["'][^"']*["']/gi, "$1");

  html = html.replace(/<div class=["']user-image-wrap["']>[\s\S]*?<\/div>/gi, "");
  html = html.replace(/Founder &amp; CEO/gi, "Websites &amp; Digital Experiences");

  if (relative.startsWith("blogs/")) {
    html = html.replace(/<div class=["']blog-details-author-image-wrap["']>[\s\S]*?<\/div>/gi, "");
    html = html.replace(/Jhon Smith/g, "FutureMinds");
    html = html.replace(/CEO of Novalab/g, "Studio Notes");
  }

  if (relative.startsWith("projects/")) {
    const replacements = [
      [
        "Custom Website had a strong product but lacked a clear brand presence that could communicate its premium positioning. The existing direction felt fragmented, making it difficult to create a consistent impression across digital touchpoints. We needed to build a brand that could feel confident, architectural, and distinctive while remaining approachable for modern buyers.",
        "This concept explores a familiar website challenge: helping a business communicate its offer clearly, create a distinctive first impression, and guide visitors toward a useful next step."
      ],
      [
        "We started by defining what Custom Website should stand for and how it could occupy a more distinctive position within the real estate market. Through strategic research, positioning, and creative exploration, we developed a visual and verbal direction centered around clarity.",
        "The exploration starts with the audience, offer, and business goals, then translates those inputs into a clear structure, content hierarchy, and visual direction."
      ],
      [
        "We delivered a complete brand system, digital experience, and strategic foundation designed to create consistency across every customer touchpoint.",
        "The concept brings together page structure, visual language, messaging, and responsive interaction patterns as one coherent website experience."
      ],
      [
        "Custom Website emerged with a cohesive identity that better reflects its premium positioning and a digital experience designed to support its next stage of growth. The new system gives the brand a stronger presence across every touchpoint while creating a flexible foundation.",
        "The result is an illustrative direction for a website that feels considered, communicates with clarity, and gives visitors a purposeful path forward."
      ],
      [
        "Custom Website was an opportunity to turn a strong real estate offering into a brand with a clear point of view. By bringing strategy, identity, and digital experience together, we created something that feels considered, memorable, and ready to move forward.",
        "This concept demonstrates how strategy, design, and thoughtful interaction can work together to create a distinctive digital experience."
      ],
      [
        "Northlane combines thoughtful strategy and expressive design to create a distinctive digital presence.",
        "FutureMinds brings strategy, design, and development together to create clear, purposeful digital experiences."
      ]
    ];
    for (const [from, to] of replacements) html = html.replaceAll(from, to);
  }

  html = html.replace(/<form\b[^>]*>/gi, (tag) => {
    let next = tag
      .replace(/\s+(?:method|action)=["'][^"']*["']/gi, "")
      .replace(/\sdata-wf-page-id=["'][^"']*["']/gi, "")
      .replace(/\sdata-wf-element-id=["'][^"']*["']/gi, "")
      .replace(/\sdata-turnstile-sitekey=["'][^"']*["']/gi, "");
    next = next.replace(/>$/, ' method="post" action="/contact.html" data-futureminds-unconfigured="true">');
    return next;
  });

  if (/data-futureminds-unconfigured="true"/.test(html) && !html.includes('id="futureminds-form-guard"')) {
    const guard = '<script id="futureminds-form-guard">\n' +
      '(function () {\n' +
      '  function prepareFutureMindsForms() {\n' +
      '    document.querySelectorAll(\'form[data-futureminds-unconfigured="true"]\').forEach(function (form) {\n' +
      '      if (form.dataset.futuremindsGuarded === \'true\') return;\n' +
      '      form.dataset.futuremindsGuarded = \'true\';\n' +
      '      form.addEventListener(\'submit\', function (event) { event.preventDefault(); event.stopImmediatePropagation(); }, true);\n' +
      '      var submit = form.querySelector(\'button[type="submit"], input[type="submit"]\');\n' +
      '      if (submit) {\n' +
      '        submit.disabled = true;\n' +
      '        submit.setAttribute(\'aria-disabled\', \'true\');\n' +
      '        if (submit.tagName === \'INPUT\') submit.value = \'Form coming soon\';\n' +
      '        else submit.textContent = \'Form coming soon\';\n' +
      '      }\n' +
      '      var notice = document.createElement(\'p\');\n' +
      '      notice.className = \'futureminds-form-notice\';\n' +
      '      notice.setAttribute(\'role\', \'status\');\n' +
      '      notice.textContent = \'Our enquiry forms are being connected. Please check back soon.\';\n' +
      '      form.parentNode.insertBefore(notice, form.nextSibling);\n' +
      '    });\n' +
      '  }\n' +
      '  if (document.readyState === \'loading\') document.addEventListener(\'DOMContentLoaded\', prepareFutureMindsForms);\n' +
      '  else prepareFutureMindsForms();\n' +
      '})();\n' +
      '</script>';
    html = html.replace(/<\/body>/i, guard + "\n</body>");
  }

  if (relative.startsWith("career/")) {
    if (!/<meta\b[^>]*http-equiv=["']refresh["']/i.test(html)) {
      html = html.replace(/<\/head>/i, '<meta http-equiv="refresh" content="0;url=/career.html"/></head>');
    }
    html = html.replace(/<meta\b[^>]*name=["']robots["'][^>]*>/i, '<meta name="robots" content="noindex,nofollow"/>');
  }

  if (html !== before) {
    fs.writeFileSync(file, html);
    changed += 1;
  }
}
process.stdout.write("Prepared " + files.length + " HTML pages; updated " + changed + ".\n");
