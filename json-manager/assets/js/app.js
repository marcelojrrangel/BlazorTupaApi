(function () {
  const ownerInput = document.getElementById("owner");
  const repoInput = document.getElementById("repo");
  const pathInput = document.getElementById("path");
  const branchInput = document.getElementById("branch");
  const listBtn = document.getElementById("listFiles");
  const fileList = document.getElementById("fileList");
  const formContainer = document.getElementById("formContainer");
  const jsonEditor = document.getElementById("jsonEditor");
  const currentFile = document.getElementById("currentFile");
  const statusBar = document.getElementById("statusBar");
  const formatJsonBtn = document.getElementById("formatJson");
  const applyJsonBtn = document.getElementById("applyJson");
  const logoutBtn = document.getElementById("logout");
  const loadWorkflowsBtn = document.getElementById("loadWorkflows");
  const runDeployBtn = document.getElementById("runDeploy");
  const workflowSelect = document.getElementById("workflowSelect");
  const workflowRef = document.getElementById("workflowRef");

  const tabs = document.querySelectorAll(".tab");
  const tabContents = {
    form: document.getElementById("tab-form"),
    json: document.getElementById("tab-json"),
  };

  let currentPath = "";
  let currentSha = "";
  let currentData = null;
  let currentSchema = null;
  let codeMirror = null;
  let typeOptions = ["Instagram", "Watsapp"];

  if (!getStoredToken()) {
    window.location.href = "login.html";
    return;
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((btn) => btn.classList.remove("active"));
      tab.classList.add("active");
      Object.values(tabContents).forEach((el) => el.classList.remove("active"));
      tabContents[tab.dataset.tab].classList.add("active");
      if (tab.dataset.tab === "json" && codeMirror) {
        codeMirror.refresh();
      }
    });
  });

  function initEditor() {
    if (window.CodeMirror) {
      codeMirror = window.CodeMirror.fromTextArea(jsonEditor, {
        mode: { name: "javascript", json: true },
        theme: "material-darker",
        lineNumbers: true,
        lineWrapping: true,
      });
    }
  }

  function getEditorValue() {
    return codeMirror ? codeMirror.getValue() : jsonEditor.value;
  }

  function setEditorValue(value) {
    if (codeMirror) {
      codeMirror.setValue(value);
      return;
    }
    jsonEditor.value = value;
  }

  function setStatus(message, isError = false) {
    statusBar.textContent = message;
    statusBar.style.color = isError ? "#b63c2f" : "";
  }

  function clearForm() {
    formContainer.innerHTML = "";
  }

  function createField(labelText, input) {
    const wrapper = document.createElement("label");
    wrapper.className = "field";
    const label = document.createElement("span");
    label.textContent = labelText;
    if (
      input instanceof HTMLInputElement &&
      input.type === "text" &&
      !input.value &&
      labelText
    ) {
      input.placeholder = labelText;
    }
    wrapper.append(label, input);
    return wrapper;
  }

  function getValueType(value) {
    if (Array.isArray(value)) return "array";
    if (value === null) return "null";
    return typeof value;
  }

  function isLogoField(pathSegments) {
    const key = pathSegments[pathSegments.length - 1];
    return typeof key === "string" && key.toLowerCase() === "logo";
  }

  function isTipoField(pathSegments) {
    const key = pathSegments[pathSegments.length - 1];
    return typeof key === "string" && key.toLowerCase() === "tipo";
  }

  function isDateField(pathSegments) {
    const key = pathSegments[pathSegments.length - 1];
    return typeof key === "string" && key.toLowerCase().includes("data");
  }

  function isDescricaoTextarea(pathSegments) {
    const key = pathSegments[pathSegments.length - 1];
    const isDescricaoField = typeof key === "string" && key.toLowerCase() === "descricao";
    const isPointsOrPrayers =
      currentPath &&
      (currentPath.toLowerCase().includes("pontos") ||
        currentPath.toLowerCase().includes("preces"));
    return isDescricaoField && isPointsOrPrayers;
  }

  function toDateTimeLocal(value) {
    if (typeof value !== "string") {
      return "";
    }
    const trimmed = value.trim();
    if (!trimmed) {
      return "";
    }

    const normalized = trimmed.replace(" ", "T");
    const match = normalized.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/);
    if (match) {
      return match[0];
    }
    return "";
  }

  function getNowDateTimeLocal() {
    const now = new Date();
    const pad = (value) => String(value).padStart(2, "0");
    const yyyy = now.getFullYear();
    const mm = pad(now.getMonth() + 1);
    const dd = pad(now.getDate());
    const hh = pad(now.getHours());
    const min = pad(now.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  }

  function normalizeDateForSave(value) {
    if (typeof value !== "string") {
      return value;
    }
    const trimmed = value.trim();
    if (!trimmed) {
      return value;
    }
    const normalized = trimmed.replace(" ", "T");
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(normalized)) {
      return normalized;
    }
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(normalized)) {
      return `${normalized}:00`;
    }
    return value;
  }

  function normalizeDatesForSave(value, pathSegments = []) {
    const type = getValueType(value);
    if (type === "array") {
      return value.map((item, index) => normalizeDatesForSave(item, [...pathSegments, index]));
    }
    if (type === "object") {
      const result = {};
      Object.keys(value).forEach((key) => {
        result[key] = normalizeDatesForSave(value[key], [...pathSegments, key]);
      });
      return result;
    }
    if (type === "string" && isDateField(pathSegments)) {
      return normalizeDateForSave(value);
    }
    return value;
  }

  function collectTipoOptions(data) {
    const values = new Set();

    function walk(value) {
      const type = getValueType(value);
      if (type === "object") {
        Object.keys(value).forEach((key) => {
          if (key.toLowerCase() === "tipo" && typeof value[key] === "string") {
            values.add(value[key]);
          }
          walk(value[key]);
        });
        return;
      }
      if (type === "array") {
        value.forEach((item) => walk(item));
      }
    }

    walk(data);
    return Array.from(values);
  }

  function refreshTipoOptions(data) {
    const collected = collectTipoOptions(data);
    typeOptions = collected.length > 0 ? collected : ["Instagram", "Watsapp"];
  }

  function looksLikeBase64(value) {
    if (typeof value !== "string") return false;
    if (value.startsWith("data:image/")) return true;
    if (value.length < 100) return false;
    return /^[A-Za-z0-9+/=\r\n]+$/.test(value);
  }

  function toImageDataUrl(value) {
    if (typeof value !== "string" || value.length === 0) {
      return "";
    }
    if (value.startsWith("data:image/")) {
      return value;
    }
    if (looksLikeBase64(value)) {
      return `data:image/png;base64,${value}`;
    }
    return "";
  }

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  function createEmptyValueFromSample(sample, pathSegments = []) {
    const type = getValueType(sample);
    if (type === "object") {
      const result = {};
      Object.keys(sample).forEach((key) => {
        const nextPath = [...pathSegments, key];
        const childType = getValueType(sample[key]);
        if (childType === "string" && isDateField(nextPath)) {
          result[key] = getNowDateTimeLocal();
        } else {
          result[key] = createEmptyValueFromSample(sample[key], nextPath);
        }
      });
      return result;
    }
    if (type === "array") {
      return [];
    }
    if (type === "number") {
      return 0;
    }
    if (type === "boolean") {
      return false;
    }
    if (type === "string") {
      return "";
    }
    return "";
  }

  function buildSchema(value) {
    const type = getValueType(value);
    if (type === "object") {
      const properties = {};
      Object.keys(value).forEach((key) => {
        properties[key] = buildSchema(value[key]);
      });
      return { type, properties, required: Object.keys(value) };
    }
    if (type === "array") {
      if (value.length === 0) {
        return { type, items: null };
      }
      return { type, items: buildSchema(value[0]) };
    }
    return { type };
  }

  function validateAgainstSchema(value, schema, path = "$") {
    const errors = [];
    const type = getValueType(value);

    if (!schema || schema.type === "any") {
      return errors;
    }

    if (schema.type !== type) {
      errors.push(`${path}: esperado ${schema.type}, recebido ${type}`);
      return errors;
    }

    if (type === "object") {
      const keys = Object.keys(value);
      schema.required.forEach((key) => {
        if (!Object.prototype.hasOwnProperty.call(value, key)) {
          errors.push(`${path}.${key}: campo obrigatorio ausente`);
        }
      });
      keys.forEach((key) => {
        if (schema.properties[key]) {
          errors.push(
            ...validateAgainstSchema(value[key], schema.properties[key], `${path}.${key}`)
          );
        }
      });
    }

    if (type === "array" && schema.items) {
      value.forEach((item, index) => {
        errors.push(...validateAgainstSchema(item, schema.items, `${path}[${index}]`));
      });
    }

    return errors;
  }

  function runValidation(value) {
    if (!currentSchema) {
      return true;
    }
    const errors = validateAgainstSchema(value, currentSchema);
    if (errors.length === 0) {
      return true;
    }
    const preview = errors.slice(0, 4).join(" | ");
    setStatus(`Validacao falhou: ${preview}`, true);
    return false;
  }

  function createInputForValue(value, pathSegments) {
    const type = getValueType(value);
    let input;

    if (isDescricaoTextarea(pathSegments)) {
      input = document.createElement("textarea");
      input.rows = 10;
      input.value = value || "";
      input.style.fontFamily = "Source Sans 3, sans-serif";
      input.style.resize = "vertical";
      input.addEventListener("input", () => {
        setValueAtPath(pathSegments, input.value);
      });
      return input;
    }

    if (isDateField(pathSegments)) {
      input = document.createElement("input");
      input.type = "datetime-local";
      input.value = toDateTimeLocal(value);
      input.addEventListener("input", () => {
        setValueAtPath(pathSegments, input.value);
      });
      return input;
    }

    if (isTipoField(pathSegments)) {
      const select = document.createElement("select");
      typeOptions.forEach((optionValue) => {
        const option = document.createElement("option");
        option.value = optionValue;
        option.textContent = optionValue;
        select.appendChild(option);
      });
      if (value && !typeOptions.includes(value)) {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = value;
        select.appendChild(option);
      }
      select.value = value || "";
      select.addEventListener("change", () => {
        setValueAtPath(pathSegments, select.value);
      });
      return select;
    }

    if (isLogoField(pathSegments)) {
      const wrapper = document.createElement("div");
      wrapper.className = "logo-field";

      const preview = document.createElement("img");
      preview.className = "logo-preview";

      const textInput = document.createElement("input");
      textInput.type = "text";
      textInput.value = value || "";

      const fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.accept = "image/*";

      const clearBtn = document.createElement("button");
      clearBtn.type = "button";
      clearBtn.className = "btn ghost";
      clearBtn.textContent = "Remover imagem";

      function updatePreview(sourceValue) {
        const dataUrl = toImageDataUrl(sourceValue);
        if (dataUrl) {
          preview.src = dataUrl;
          preview.style.display = "block";
        } else {
          preview.src = "";
          preview.style.display = "none";
        }
      }

      updatePreview(value);

      textInput.addEventListener("input", () => {
        setValueAtPath(pathSegments, textInput.value);
        updatePreview(textInput.value);
      });

      fileInput.addEventListener("change", async () => {
        const file = fileInput.files && fileInput.files[0];
        if (!file) {
          return;
        }
        const dataUrl = await readFileAsDataUrl(file);
        textInput.value = dataUrl;
        setValueAtPath(pathSegments, dataUrl);
        updatePreview(dataUrl);
      });

      clearBtn.addEventListener("click", () => {
        textInput.value = "";
        setValueAtPath(pathSegments, "");
        updatePreview("");
      });

      wrapper.appendChild(preview);
      wrapper.appendChild(textInput);
      wrapper.appendChild(fileInput);
      wrapper.appendChild(clearBtn);
      return wrapper;
    }

    if (type === "boolean") {
      input = document.createElement("input");
      input.type = "checkbox";
      input.checked = value;
      input.addEventListener("change", () => {
        setValueAtPath(pathSegments, input.checked);
      });
      return input;
    }

    if (type === "number") {
      input = document.createElement("input");
      input.type = "number";
      input.value = value;
      input.addEventListener("input", () => {
        const parsed = Number(input.value);
        setValueAtPath(pathSegments, Number.isNaN(parsed) ? 0 : parsed);
      });
      return input;
    }

    input = document.createElement("input");
    input.type = "text";
    input.value = value === null ? "" : String(value);
    input.addEventListener("input", () => {
      setValueAtPath(pathSegments, input.value);
    });
    return input;
  }

  function setValueAtPath(pathSegments, value) {
    let target = currentData;
    for (let i = 0; i < pathSegments.length - 1; i += 1) {
      target = target[pathSegments[i]];
    }
    target[pathSegments[pathSegments.length - 1]] = value;
    syncEditor();
  }

  function buildForm(data, container, pathSegments = []) {
    const type = getValueType(data);

    if (type === "object") {
      Object.keys(data).forEach((key) => {
        const childType = getValueType(data[key]);
        if (childType === "object" || childType === "array") {
          const group = document.createElement("div");
          group.className = "form-group";
          const title = document.createElement("h4");
          title.textContent = key;
          group.appendChild(title);
          buildForm(data[key], group, [...pathSegments, key]);
          container.appendChild(group);
        } else {
          const input = createInputForValue(data[key], [...pathSegments, key]);
          container.appendChild(createField(key, input));
        }
      });
      return;
    }

    if (type === "array") {
      data.forEach((item, index) => {
        const itemWrap = document.createElement("div");
        itemWrap.className = "array-item";
        const itemType = getValueType(item);
        if (itemType === "object" || itemType === "array") {
          buildForm(item, itemWrap, [...pathSegments, index]);
        } else {
          const input = createInputForValue(item, [...pathSegments, index]);
          itemWrap.appendChild(createField(`Item ${index + 1}`, input));
        }

        const actions = document.createElement("div");
        actions.className = "array-actions";
        const removeBtn = document.createElement("button");
        removeBtn.className = "btn danger";
        removeBtn.type = "button";
        removeBtn.textContent = "Remover";
        removeBtn.addEventListener("click", () => {
          data.splice(index, 1);
          refreshForm();
        });
        actions.appendChild(removeBtn);
        itemWrap.appendChild(actions);
        container.appendChild(itemWrap);
      });

      const addBtn = document.createElement("button");
      addBtn.className = "btn ghost";
      addBtn.type = "button";
      addBtn.textContent = "Adicionar item";
      addBtn.addEventListener("click", () => {
        const sample = data[0];
        if (!sample) {
          data.push({});
          refreshForm();
          return;
        }
        const newValue = createEmptyValueFromSample(sample, [...pathSegments, data.length]);
        data.push(newValue);
        refreshForm();
      });
      container.appendChild(addBtn);
    }
  }

  function refreshForm() {
    clearForm();
    if (currentData) {
      buildForm(currentData, formContainer);
      syncEditor();
    }
  }

  function syncEditor() {
    if (currentData) {
      setEditorValue(JSON.stringify(currentData, null, 2));
    }
  }

  async function ensureRepoDefaults(force = false) {
    const owner = ownerInput.value.trim();
    const repo = repoInput.value.trim();
    if (!owner || !repo) {
      return;
    }
    try {
      const repoData = await getRepo(owner, repo);
      const defaultBranch = repoData.default_branch;
      if (!defaultBranch) {
        return;
      }
      if (force || !branchInput.value.trim() || branchInput.value.trim() === "master") {
        branchInput.value = defaultBranch;
      }
      if (force || !workflowRef.value.trim() || workflowRef.value.trim() === "master") {
        workflowRef.value = defaultBranch;
      }
    } catch (error) {
      setStatus(error.message, true);
    }
  }

  async function loadFiles() {
    setStatus("Carregando arquivos...");
    fileList.innerHTML = "";
    try {
      await ensureRepoDefaults();
      const files = await listRepoContents(
        ownerInput.value.trim(),
        repoInput.value.trim(),
        pathInput.value.trim()
      );
      console.log("Resposta da API:", files);
      if (!Array.isArray(files)) {
        throw new Error("Resposta da API nao eh um array. Verifique o caminho do repositorio.");
      }
      const jsonFiles = files.filter((item) => item.name.endsWith(".json"));
      console.log(`Encontrados ${jsonFiles.length} arquivos JSON`);
      jsonFiles.forEach((item) => {
        const div = document.createElement("div");
        div.className = "file-item";
        div.textContent = item.name;
        div.addEventListener("click", () => loadFile(item));
        fileList.appendChild(div);
      });
      setStatus(`${jsonFiles.length} arquivo(s) carregado(s).`);
    } catch (error) {
      console.error("Erro ao carregar arquivos:", error);
      setStatus(error.message, true);
    }
  }

  async function loadFile(item) {
    const owner = ownerInput.value.trim();
    const repo = repoInput.value.trim();
    const basePath = pathInput.value.trim();
    currentPath = `${basePath}/${item.name}`;
    setStatus(`Carregando ${item.name}...`);

    document.querySelectorAll(".file-item").forEach((el) => {
      el.classList.toggle("active", el.textContent === item.name);
    });

    try {
      const fileData = await getRepoFile(owner, repo, currentPath);
      console.log("Arquivo recebido:", fileData);
      let decoded = decodeBase64Content(fileData.content);
      if (decoded.charCodeAt(0) === 0xfeff) {
        decoded = decoded.slice(1);
      }
      console.log("Conteudo decodificado (primeiros 200 chars):", decoded.slice(0, 200));
      currentSha = fileData.sha;
      currentData = JSON.parse(decoded);
      currentSchema = buildSchema(currentData);
      refreshTipoOptions(currentData);
      currentFile.textContent = item.name;
      refreshForm();
      setStatus("Arquivo carregado.");
    } catch (error) {
      console.error("Falha ao carregar arquivo:", error);
      setStatus(error.message, true);
    }
  }

  async function applyJson() {
    if (!currentData) {
      setStatus("Nenhum arquivo carregado.", true);
      return;
    }
    try {
      const parsed = JSON.parse(getEditorValue());
      if (!runValidation(parsed)) {
        return;
      }
      currentData = parsed;
      refreshTipoOptions(currentData);
      refreshForm();
      setStatus("JSON aplicado. Salvando...");
      await saveFile();
      setStatus("JSON aplicado e salvo. Deploy automatico pelo GitHub Pages.");
    } catch (error) {
      setStatus(`JSON invalido: ${error.message}`, true);
    }
  }

  async function saveFile() {
    if (!currentData) {
      setStatus("Nenhum arquivo carregado.", true);
      return;
    }

    const owner = ownerInput.value.trim();
    const repo = repoInput.value.trim();
    const branch = branchInput.value.trim();
    const message = `Atualiza ${currentPath} via JSON Manager`;
    try {
      if (!runValidation(currentData)) {
        return;
      }
      const latest = await getRepoFile(owner, repo, currentPath);
      currentSha = latest.sha;
      const normalizedData = normalizeDatesForSave(currentData);
      const jsonText = JSON.stringify(normalizedData, null, 2);
      const encoded = encodeBase64Content(jsonText);
      await upsertRepoFile(owner, repo, currentPath, encoded, currentSha, message, branch);
      setStatus("Arquivo salvo no GitHub.");
    } catch (error) {
      setStatus(error.message, true);
    }
  }

  async function formatJson() {
    try {
      const parsed = JSON.parse(getEditorValue());
      setEditorValue(JSON.stringify(parsed, null, 2));
      setStatus("JSON formatado.");
    } catch (error) {
      setStatus(`JSON invalido: ${error.message}`, true);
    }
  }

  async function loadWorkflows() {
    const owner = ownerInput.value.trim();
    const repo = repoInput.value.trim();
    try {
      await ensureRepoDefaults();
      workflowSelect.innerHTML = "";
      const placeholder = document.createElement("option");
      placeholder.value = "";
      placeholder.textContent = "Selecione um workflow";
      workflowSelect.appendChild(placeholder);
      const data = await listWorkflows(owner, repo);
      const workflows = Array.isArray(data.workflows) ? data.workflows : [];
      workflows.forEach((workflow) => {
        const option = document.createElement("option");
        option.value = workflow.id;
        option.textContent = workflow.name;
        workflowSelect.appendChild(option);
      });
      if (workflows.length === 0) {
        setStatus("Nenhum workflow encontrado no repositorio.", true);
        return;
      }
      setStatus("Workflows carregados.");
    } catch (error) {
      setStatus(error.message, true);
    }
  }

  async function runDeploy() {
    const owner = ownerInput.value.trim();
    const repo = repoInput.value.trim();
    const workflowId = workflowSelect.value;
    if (!workflowId) {
      setStatus("Selecione um workflow.", true);
      return;
    }
    try {
      await dispatchWorkflow(owner, repo, workflowId, workflowRef.value.trim());
      setStatus("Deploy disparado.");
    } catch (error) {
      setStatus(error.message, true);
    }
  }

  listBtn.addEventListener("click", loadFiles);
  formatJsonBtn.addEventListener("click", formatJson);
  applyJsonBtn.addEventListener("click", applyJson);
  loadWorkflowsBtn.addEventListener("click", loadWorkflows);
  runDeployBtn.addEventListener("click", runDeploy);

  initEditor();

  logoutBtn.addEventListener("click", () => {
    clearStoredToken();
    window.location.href = "login.html";
  });
})();
