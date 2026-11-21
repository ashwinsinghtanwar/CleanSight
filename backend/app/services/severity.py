def severity(coverage: float, count: int = 1, low: float = 10, medium: float = 30) -> str:
    """Coverage = % of the image covered by detected boxes (union)."""
    if count == 0:
        return "None"
    return "Low" if coverage <= low else "Medium" if coverage <= medium else "High"
