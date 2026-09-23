# Fraud detection methodology

Fraud detection is intentionally rule-based and explainable for this educational project. It is not a machine-learning model and does not claim to predict real-world fraud.

## Initial rules

| Rule | Demonstration signal | Default weight |
| --- | --- | ---: |
| Duplicate transaction | Same account, merchant, amount, and near timestamp | +40 |
| Large transaction | Configurable absolute threshold or historical deviation | +25 |
| High frequency | More than a configurable count within 10 minutes | +20 |
| Unusual timing | Transaction in a configurable unusual-hours window | +10 |
| Multiple signals | Several rules trigger together | +15 |

The final score is capped at 100:

- `0–29`: LOW
- `30–59`: MEDIUM
- `60–100`: HIGH

Each evaluated transaction will retain its score, severity, triggered rules, and human-readable reason. An alert is created when the configured threshold is crossed, with an `OPEN → REVIEWED → RESOLVED` lifecycle.

## Important limitation

These weights and thresholds are project-defined demonstration values. They must not be used for real financial decisions, account blocking, or compliance conclusions.
