export function getGradeColorClasses(grade: number | null) {
  if (grade === null) {
    return {
      text: "text-outline",
      bg: "bg-surface-container",
      border: "border-outline-variant",
      dot: "bg-outline-variant",
    };
  }
  if (grade < 5) {
    return {
      text: "text-error",
      bg: "bg-error-container",
      border: "border-error",
      dot: "bg-error",
    };
  }
  if (grade < 7) {
    return {
      text: "text-on-warning-container",
      bg: "bg-warning-container",
      border: "border-warning",
      dot: "bg-warning",
    };
  }
  return {
    text: "text-primary",
    bg: "bg-primary-fixed",
    border: "border-primary",
    dot: "bg-primary",
  };
}
