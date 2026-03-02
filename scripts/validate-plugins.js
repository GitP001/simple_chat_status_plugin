const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');

const SPEC_FILE = 'pluginspec.yml';
const REQUIRED_FIELDS = ['name', 'version', 'url', 'description'];

const DANGEROUS_PATTERNS = [
  { pattern: /eval\s*\(/, name: 'eval()' },
  { pattern: /new\s+Function\s*\(/, name: 'new Function()' },
  { pattern: /document\.write/, name: 'document.write' },
  { pattern: /innerHTML\s*=/, name: 'innerHTML assignment' },
  { pattern: /fetch\s*\(/, name: 'fetch() - external requests' },
  { pattern: /XMLHttpRequest/, name: 'XMLHttpRequest' },
  { pattern: /localStorage/, name: 'localStorage access' },
  { pattern: /sessionStorage/, name: 'sessionStorage access' },
  { pattern: /document\.cookie/, name: 'cookie access' },
  { pattern: /<script/, name: 'script tag injection' }
];

let hasError = false;
let hasWarning = false;

function log(type, ...args) {
  const icons = { ok: '✓', error: '✗', warn: '⚠', info: '→' };
  console.log(icons[type] || '', ...args);
}

function loadSpec() {
  console.log('\n📄 Validating YAML syntax...');
  try {
    const doc = yaml.load(fs.readFileSync(SPEC_FILE, 'utf8'));
    log('ok', 'YAML syntax is valid');
    log('info', `Found ${doc.plugins.length} plugin(s)`);
    return doc;
  } catch (e) {
    log('error', 'YAML syntax error:', e.message);
    process.exit(1);
  }
}

function validateSchema(doc) {
  console.log('\n📋 Validating plugin schema...');

  doc.plugins.forEach((plugin, index) => {
    const name = plugin.name || `plugin[${index}]`;

    REQUIRED_FIELDS.forEach(field => {
      if (!plugin[field]) {
        log('error', `${name}: missing required field "${field}"`);
        hasError = true;
      }
    });

    if (plugin.version && !/^\d+\.\d+(\.\d+)?$/.test(String(plugin.version))) {
      log('error', `${name}: invalid version format "${plugin.version}"`);
      hasError = true;
    }

    if (plugin.url && !plugin.url.endsWith('.js')) {
      log('error', `${name}: url must end with .js`);
      hasError = true;
    }
  });

  if (!hasError) log('ok', 'All plugins have valid schema');
}

function checkFilesExist(doc) {
  console.log('\n📁 Checking plugin files exist...');

  doc.plugins.forEach(plugin => {
    if (fs.existsSync(plugin.url)) {
      log('ok', `${plugin.url} exists`);
    } else {
      log('error', `${plugin.url} not found`);
      hasError = true;
    }
  });
}

function validateJsSyntax(doc) {
  console.log('\n🔧 Validating JavaScript syntax...');

  doc.plugins.forEach(plugin => {
    if (!fs.existsSync(plugin.url)) return;

    const code = fs.readFileSync(plugin.url, 'utf8');
    try {
      new Function(code);
      log('ok', `${plugin.url} syntax OK`);
    } catch (e) {
      log('error', `${plugin.url} syntax error: ${e.message}`);
      hasError = true;
    }
  });
}

function validatePluginStructure(doc) {
  console.log('\n🏗️  Validating plugin structure...');

  doc.plugins.forEach(plugin => {
    if (!fs.existsSync(plugin.url)) return;

    const code = fs.readFileSync(plugin.url, 'utf8');

    if (!code.includes('function onLoad')) {
      log('error', `${plugin.url} missing onLoad function`);
      hasError = true;
    } else {
      log('ok', `${plugin.url} has onLoad function`);
    }

    if (!code.includes('registerPluginActions')) {
      log('warn', `${plugin.url} missing registerPluginActions call`);
      hasWarning = true;
    }
  });
}

function securityCheck(doc) {
  console.log('\n🔒 Running security checks...');

  doc.plugins.forEach(plugin => {
    if (!fs.existsSync(plugin.url)) return;

    const code = fs.readFileSync(plugin.url, 'utf8');
    log('info', `Scanning ${plugin.url}`);

    DANGEROUS_PATTERNS.forEach(({ pattern, name }) => {
      if (pattern.test(code)) {
        log('warn', `Found potentially dangerous pattern: ${name}`);
        hasWarning = true;
      }
    });
  });

  if (!hasWarning) log('ok', 'No dangerous patterns detected');
}

function checkDuplicates(doc) {
  console.log('\n🔍 Checking for duplicate plugins...');

  const names = doc.plugins.map(p => p.name);
  const duplicates = names.filter((name, index) => names.indexOf(name) !== index);

  if (duplicates.length > 0) {
    log('error', `Duplicate plugin names: ${[...new Set(duplicates)].join(', ')}`);
    hasError = true;
  } else {
    log('ok', 'No duplicate plugin names');
  }
}

function main() {
  console.log('🚀 Plugin Validation Started');
  console.log('='.repeat(40));

  const doc = loadSpec();
  validateSchema(doc);
  checkFilesExist(doc);
  validateJsSyntax(doc);
  validatePluginStructure(doc);
  securityCheck(doc);
  checkDuplicates(doc);

  console.log('\n' + '='.repeat(40));

  if (hasError) {
    console.log('❌ Validation FAILED');
    process.exit(1);
  } else if (hasWarning) {
    console.log('⚠️  Validation PASSED with warnings');
  } else {
    console.log('✅ Validation PASSED');
  }
}

main();