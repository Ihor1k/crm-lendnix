# Lendnix Data Platform (CRM)

Demo-stage web application for the Lendnix Data Platform. All data is mocked. There is no real backend, Kafka, pipeline execution, or authentication.

## Figma

[CRM Project Lendnix](https://www.figma.com/design/YNtkgcBE612j3KhHTMBDSA/CRM-Project-Lendnix--Copy-?node-id=9-7267&m=dev)

## Product screens

| Section | Behavior | Screens |
| --- | --- | --- |
| Login | Demo | Login |
| Dashboard | Visual only | Overview |
| Data Sources | Editable | List, Create / Edit |
| Pipelines | Demo | List, Pipeline Overview |
| Streaming | Visual only | Overview, Topic & Messages |
| Data Catalog | Visual only | Catalog |
| Data Quality | Visual only | Overview |
| Customer 360 | Visual only | Customer 360 |
| Reports & Analytics | Visual only | Reports |
| Alerts | Editable, demo | Alerts (+ Create Alert modal) |
| Settings | Visual only | Settings |

Reusable UI: Create Alert modal, delete confirmation, event details drawer, pipeline run drawer, data quality issue drawer, toasts, loading and empty states.

## Demo flow

Login → Dashboard → Data Sources (Payments Database) → Pipeline Overview (Customer 360 Refresh) → Streaming (`customer-events`) → Customer 360 → Data Catalog → Data Quality → Alerts → Reports.

Story: Source → Pipeline → Event Stream → Data Quality → Business Object → Data Access → Customer 360 → Monitoring → Analytics.

## Run

```bash
npm install
npm run dev
```
