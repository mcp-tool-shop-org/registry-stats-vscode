<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.md">English</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/registry-stats-vscode/readme.png" width="400" alt="Registry Stats">
</p>

<p><strong>VS Code के अंदर ही हर निर्भरता के लिए डाउनलोड आँकड़े देखें। यह npm, PyPI, NuGet, VS Code Marketplace और Docker Hub का समर्थन करता है।</strong></p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/registry-stats-vscode/actions"><img src="https://github.com/mcp-tool-shop-org/registry-stats-vscode/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://marketplace.visualstudio.com/items?itemName=mcp-tool-shop.registry-stats-vscode"><img src="https://img.shields.io/visual-studio-marketplace/v/mcp-tool-shop.registry-stats-vscode" alt="VS Marketplace"></a>
  <a href="https://github.com/mcp-tool-shop-org/registry-stats-vscode/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/registry-stats-vscode/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

---

## यह क्या करता है

Registry Stats आपके कार्यक्षेत्र में पैकेज मैनिफेस्ट (`package.json`, `pyproject.toml`, `*.csproj`) को स्कैन करता है और पांच रजिस्ट्री से लाइव डाउनलोड आँकड़े प्राप्त करता है। npm, PyPI, NuGet या VS Code Marketplace के लिए किसी API कुंजी की आवश्यकता नहीं है।

**तीन रिपोर्ट प्रारूप, तीन दर्शक:**

| दर्शक | प्रारूप | उपयोग |
|----------|--------|----------|
| **Executive** | PDF | हितधारकों के साथ साझा करें - एक पृष्ठ पर मुख्य प्रदर्शन संकेतक (KPI), शीर्ष पैकेज, जोखिम |
| **LLM** | JSONL | AI उपकरणों को डेटा प्रदान करें - स्कीमा-वर्ज़न, उत्पत्ति टैग, स्ट्रीमिंग के लिए अनुकूल |
| **Dev** | Markdown | समस्याओं/PR में पेस्ट करें - विस्तार योग्य ट्रेस, प्रति-पैकेज तालिका, त्रुटि विवरण |

## शुरुआत कैसे करें

1. [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=mcp-tool-shop.registry-stats-vscode) से इंस्टॉल करें।
2. एक ऐसे प्रोजेक्ट को खोलें जिसमें `package.json`, `pyproject.toml` या `*.csproj` हो।
3. स्टेटस बार स्वचालित रूप से आपके प्राथमिक पैकेज की डाउनलोड संख्या दिखाता है।
4. साइडबार खोलने के लिए गतिविधि बार में **Registry Stats** आइकन पर क्लिक करें।

## विशेषताएं

### स्टेटस बार

आपके प्राथमिक पैकेज की साप्ताहिक डाउनलोड संख्या स्टेटस बार में दिखाई देती है। विस्तृत जानकारी के लिए, दैनिक, साप्ताहिक, मासिक और कुल डाउनलोड संख्या देखने के लिए उस पर होवर करें। साइडबार खोलने के लिए क्लिक करें।

### निर्भरताओं पर होवर करें

`package.json`, `pyproject.toml` या `*.csproj` में किसी भी निर्भरता नाम पर होवर करें ताकि टूलटिप तालिका में इसकी डाउनलोड आँकड़े दिखाई दें।

### दर्शक बदलने वाला साइडबार

साइडबार आपको एग्जीक्यूटिव, LLM और देव रिपोर्ट व्यू के बीच स्विच करने की अनुमति देता है। ताज़ा डेटा प्राप्त करने के लिए **रिफ्रेश** पर क्लिक करें, क्लिपबोर्ड पर कॉपी करने के लिए **कॉपी** पर क्लिक करें, या फ़ाइल में सहेजने के लिए **एक्सपोर्ट** पर क्लिक करें।

- **एग्जीक्यूटिव** PDF के रूप में एक्सपोर्ट होता है (pdfmake के साथ जेनरेट किया गया - कोई ब्राउज़र इंजन नहीं, हर जगह काम करता है)
- **LLM** JSONL के रूप में एक्सपोर्ट होता है (प्रत्येक पंक्ति में एक JSON ऑब्जेक्ट, जिसमें ताज़गी और त्रुटि मेटाडेटा शामिल है)
- **देव** Markdown के रूप में एक्सपोर्ट होता है (विस्तार योग्य कच्चा ट्रेस, संरचित त्रुटि सूची)

### रिपोर्ट जेनरेट करने का कमांड

`Ctrl+Shift+P` → **Registry Stats: Generate Report** आपको निम्नलिखित चरणों में मार्गदर्शन करता है:
1. एक दर्शक चुनें (एग्जीक्यूटिव / LLM / देव)
2. एक आउटपुट चुनें (कॉपी / सेव / एडिटर में पूर्वावलोकन)

## कमांड

| कमांड | विवरण |
|---------|-------------|
| **Registry Stats: Generate Report** | गाइडेड रिपोर्ट जेनरेशन (दर्शक → आउटपुट) |
| **Registry Stats: Refresh Stats** | कैश साफ़ करें और सभी डेटा को फिर से प्राप्त करें |
| **Registry Stats: Open Sidebar** | साइडबार पैनल पर ध्यान केंद्रित करें |
| **Registry Stats: Copy Executive Summary** | एग्जीक्यूटिव रिपोर्ट को जल्दी से कॉपी करें |
| **Registry Stats: Copy LLM Log (JSONL)** | LLM रिपोर्ट को जल्दी से कॉपी करें |
| **Registry Stats: Copy Dev Log (Markdown)** | देव रिपोर्ट को जल्दी से कॉपी करें |

## समर्थित रजिस्ट्री

| रजिस्ट्री | उपलब्ध डेटा | ऑथ की आवश्यकता |
|----------|---------------|-------------|
| **npm** | दैनिक, साप्ताहिक, मासिक डाउनलोड | No |
| **PyPI** | दैनिक, साप्ताहिक, मासिक, कुल | No |
| **NuGet** | कुल | No |
| **VS Code Marketplace** | कुल इंस्टॉलेशन, रेटिंग | No |
| **Docker Hub** | कुल पुल | वैकल्पिक (रेट लिमिट बढ़ाता है) |

## मैनिफेस्ट डिटेक्शन

एक्सटेंशन स्वचालित रूप से आपके कार्यक्षेत्र के पैकेजों का पता लगाता है:

| मैनिफेस्ट | रजिस्ट्री | स्कैन किया गया |
|----------|----------|----------------|
| `package.json` | npm | `dependencies`, `devDependencies`. यदि इसमें `publisher` + `engines.vscode` है, तो प्राथमिक को VS Code एक्सटेंशन के रूप में पहचाना जाता है। |
| `pyproject.toml` | PyPI | `[project].dependencies`, `[tool.poetry.dependencies]` |
| `*.csproj` | NuGet | `<PackageReference>` तत्व |

## सेटिंग्स

| सेटिंग | डिफ़ॉल्ट | विवरण |
|---------|---------|-------------|
| `registryStats.enabledRegistries` | सभी पाँच | किन रजिस्ट्रीज़ को खोजा जाए |
| `registryStats.cacheTtlHours` | `{ npm: 6, pypi: 6, nuget: 12, vscode: 12, docker: 24 }` | प्रत्येक रजिस्ट्री के लिए कैश TTL |
| `registryStats.statusBar.enabled` | `true` | स्टेटस बार आइटम दिखाएं |
| `registryStats.hover.enabled` | `true` | निर्भरताओं पर होवर करने पर आंकड़े दिखाएं |
| `registryStats.devLogging.enabled` | `false` | रिपोर्टों में विस्तृत ट्रेस शामिल करें |
| `registryStats.devLogging.level` | `info` | ट्रेस की गहराई (`info` या `debug`) |
| `registryStats.dockerToken` | `""` | दर सीमाओं को बढ़ाने के लिए Docker Hub टोकन |
| `registryStats.maxConcurrentRequests` | `3` | अधिकतम समानांतर रजिस्ट्री अनुरोध |

## कैशिंग

आंकड़े VS Code के `globalState` में कैश किए जाते हैं (पुनरारंभ के बीच बने रहते हैं)। प्रत्येक रजिस्ट्री का अपना TTL होता है। एक्सटेंशन **स्टेल-व्हाइल-रीवैलिडेट** का उपयोग करता है: यदि कैश किया गया डेटा मौजूद है लेकिन पुराना है, तो उसे तुरंत वापस कर दिया जाता है, जबकि पृष्ठभूमि में एक ताज़ा प्रक्रिया चलती है। इससे UI तेज़ रहता है।

## रिपोर्ट प्रारूपों का विवरण

### कार्यकारी (PDF)

एक पृष्ठ की रिपोर्ट जो [pdfmake](https://pdfmake.github.io/docs/) के साथ बनाई गई है (शुद्ध जावास्क्रिप्ट, क्रोमियम की आवश्यकता नहीं)। इसमें शामिल हैं:

- KPI कार्ड: कुल पैकेज, कवर की गई रजिस्ट्रीज़, डेटा की ताजगी, विफलताएं
- साप्ताहिक डाउनलोड के आधार पर शीर्ष 15 पैकेज
- रजिस्ट्री ब्रेकडाउन तालिका
- जोखिम और सिफारिशें

### LLM (JSONL)

स्कीमा-वर्जन वाली JSON लाइनें आउटपुट। प्रत्येक पंक्ति एक स्व-निहित JSON ऑब्जेक्ट है:

```
{"type":"header","schema_version":"1.0","run_id":"...","workspace":{...}}
{"type":"package","registry":"npm","name":"express","downloads":{...},"freshness_hours":0.5}
{"type":"package","registry":"pypi","name":"flask","error":{"code":"FETCH_FAILED","retryable":true}}
{"type":"summary","total":48,"succeeded":45,"failed":3,"duration_ms":2100}
{"type":"trace","level":"info","component":"fetcher","event":"fetch.complete","duration_ms":1800}
```

प्रत्येक आंकड़े में `freshness_hours` और `source_registry` शामिल हैं ताकि LLM डेटा की गुणवत्ता के बारे में तर्क कर सकें।

### डेव (मार्कडाउन)

संरचित मार्कडाउन जिसमें संकुचित अनुभाग हैं:

- **रन सारांश** — सफलता/विफलता/पुराने गणनाएं, कुल अवधि
- **रजिस्ट्री ब्रेकडाउन** — प्रति-रजिस्ट्री तालिका
- **मैनिफेस्ट स्कैन** — कौन सी फ़ाइलें किन पैकेजों में योगदान करती हैं
- **प्रति-पैकेज परिणाम** — पूर्ण आंकड़े तालिका
- **त्रुटियां** — संरचित त्रुटि विवरण जिसमें पुनः प्रयास के संकेत शामिल हैं
- **ट्रेस** — एक संकुचित `<details>` ब्लॉक में कच्चा इवेंट लॉग

## खतरे का मॉडल

**डेटा जिस पर कार्रवाई की जाती है:** सार्वजनिक रजिस्ट्री API से पैकेज नाम और डाउनलोड गणना। निर्भरताओं का पता लगाने के लिए मैनिफेस्ट फ़ाइलें (`package.json`, `pyproject.toml`, `*.csproj`) पढ़ी जाती हैं — कोई फ़ाइल लेखन नहीं।

**डेटा जिस पर कार्रवाई नहीं की जाती:** स्रोत कोड सामग्री, क्रेडेंशियल, पर्यावरण चर, गिट इतिहास, टर्मिनल आउटपुट।

**नेटवर्क:** सार्वजनिक API (npm, PyPI, NuGet, VS Code Marketplace, Docker Hub) के लिए केवल-पढ़ने वाले अनुरोध। कोई डेटा ऊपर नहीं भेजा जाता है। वैकल्पिक Docker Hub टोकन VS Code सेटिंग्स में संग्रहीत है।

**कोई टेलीमेट्री नहीं।** कोई विश्लेषण नहीं। कोई ट्रैकिंग नहीं।

## स्कोरकार्ड

[@mcptoolshop/shipcheck](https://github.com/mcp-tool-shop-org/shipcheck) के साथ मूल्यांकन किया गया।

| गेट | स्थिति | टिप्पणियाँ |
|------|--------|-------|
| **A. Security** | पास | SECURITY.md, खतरा मॉडल, कोई टेलीमेट्री नहीं, कोई गुप्त जानकारी नहीं |
| **B. Error Handling** | पास | संरचित त्रुटि आकार (`code`/`message`/`hint`/`retryable`), VS Code अधिसूचना API |
| **C. Operator Docs** | पास | पूर्ण README, CHANGELOG, LICENSE |
| **D. Shipping Hygiene** | पास | `verify` स्क्रिप्ट, लॉकफ़ाइल, `engines.node`, क्लीन VSIX |
| **E. Identity** | पास | लोगो, अनुवाद, लैंडिंग पृष्ठ, रेपो मेटाडेटा |

## बनाया गया

- [@mcptoolshop/registry-stats](https://github.com/mcp-tool-shop-org/registry-stats) — मुख्य आंकड़े इंजन (शून्य निर्भरता)
- [pdfmake](https://pdfmake.github.io/docs/) — PDF पीढ़ी (शुद्ध JS, कोई देशी निर्भरता नहीं)

---

MCP टूल शॉप द्वारा बनाया गया <a href="https://mcp-tool-shop.github.io/">
