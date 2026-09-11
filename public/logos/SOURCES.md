# Logo sources

Every SVG in this folder is the brand's own artwork, downloaded from the
brand's official source on 2026-09-08. Nothing has been recoloured, cropped,
or redrawn — the only edit made to any file is noted in the table.

Two shapes come out of this, which is why `SkillLogo` in `src/icons.jsx`
renders them differently:

- **square** — an official product icon, full-colour on transparent. Sits bare
  on the dark background.
- **wide** — a horizontal lockup (symbol + wordmark). These brands publish no
  symbol-only file, and their guidelines forbid cropping one out, so the
  lockup is used whole on a warm paper chip (`--paper`), which is the light
  background the artwork is drawn for.

| File | Shape | Official source |
|---|---|---|
| `microsoftazure.svg` | square | [Azure architecture icons](https://learn.microsoft.com/en-us/azure/architecture/icons/) → `Azure_Public_Service_Icons_V24.zip` → `Icons/other/10018-icon-service-Azure-A.svg` |
| `azuredevops.svg` | square | [Azure architecture icons](https://learn.microsoft.com/en-us/azure/architecture/icons/) → `Azure_Public_Service_Icons_V24.zip` → `Icons/devops/10261-icon-service-Azure-DevOps.svg` |
| `powerbi.svg` | square | [Microsoft Fabric icons](https://learn.microsoft.com/en-us/fabric/fundamentals/icons) → [`fabric-samples/docs-samples/Icons.zip`](https://github.com/microsoft/fabric-samples/blob/main/docs-samples/Icons.zip) → `dist/svg/power_bi_48_color.svg`. **Edit:** ships without a `viewBox`; `viewBox="0 0 48 48"` added so it scales in an `<img>`. Paths untouched. |
| `cplusplus.svg` | square | [isocpp/logos](https://github.com/isocpp/logos) → `cpp_logo.svg` (the Standard C++ Foundation's own logo repo) |
| `python.svg` | wide | [python.org community logos](https://www.python.org/community/logos/) → `python-logo-inkscape.svg` |
| `apacheairflow.svg` | wide | [apache/airflow](https://github.com/apache/airflow) → `registry/public/airflow_logo_light.svg` |
| `apachekafka.svg` | wide | [apache/kafka-site](https://github.com/apache/kafka-site) → `43/images/kafka-logo-readme-light.svg` |
| `langchain.svg` | wide | [langchain-ai/langchain](https://github.com/langchain-ai/langchain) → `.github/images/logo-light.svg` |
| `ros.svg` | wide | [ros-infrastructure/artwork](https://github.com/ros-infrastructure/artwork) → `ros_logo.svg` (the official ROS artwork repo) |
| `espressif.svg` | wide | [ESP-IDF documentation](https://docs.espressif.com/projects/esp-idf/en/latest/esp32/) → `_static/espressif-logo.svg` |
| `googlecloud.svg` | wide | Google-hosted brand asset: `https://www.gstatic.com/cgc/google-cloud-logo-fullcolor.svg`, linked from [cloud.google.com/icons](https://cloud.google.com/icons) |

## Not official

These three brands gate their logo files, so they are still the older redrawn
marks rather than genuine artwork:

| File | Why |
|---|---|
| `unity.svg` | Unity's assets live on Brandfolder behind a Unity SSO / Brandfolder login. |
| `meta.svg` | Meta's brand centre states "all usage of the Meta logo requires approval". |
| `bluetooth.svg` | The Bluetooth SIG licenses its marks to member companies only. |

If you get access to any of them, drop the official file in here under the
same name — no code change is needed.

## Licence notes

The Microsoft icons (`microsoftazure`, `azuredevops`, `powerbi`) are published
under terms that permit use "in architectural diagrams, training materials, or
documentation", and forbid cropping, distorting, or using them to represent
your own product or service. They are used here unmodified, to label the tools
listed in the skills section. If that reading ever feels too thin, those three
are the ones to revisit.
