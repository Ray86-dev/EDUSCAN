import { describe, it, expect } from "vitest";
import { getGradeLabel } from "../utils/grade-label";

describe("getGradeLabel", () => {
  it("returns Insuficiente for grades below 5", () => {
    expect(getGradeLabel(0)).toBe("Insuficiente");
    expect(getGradeLabel(2.5)).toBe("Insuficiente");
    expect(getGradeLabel(4.9)).toBe("Insuficiente");
  });

  it("returns Suficiente for grades 5 to 5.9", () => {
    expect(getGradeLabel(5)).toBe("Suficiente");
    expect(getGradeLabel(5.5)).toBe("Suficiente");
    expect(getGradeLabel(5.9)).toBe("Suficiente");
  });

  it("returns Bien for grades 6 to 6.9", () => {
    expect(getGradeLabel(6)).toBe("Bien");
    expect(getGradeLabel(6.5)).toBe("Bien");
    expect(getGradeLabel(6.9)).toBe("Bien");
  });

  it("returns Notable for grades 7 to 8.9", () => {
    expect(getGradeLabel(7)).toBe("Notable");
    expect(getGradeLabel(8)).toBe("Notable");
    expect(getGradeLabel(8.9)).toBe("Notable");
  });

  it("returns Sobresaliente for grades 9 to 10", () => {
    expect(getGradeLabel(9)).toBe("Sobresaliente");
    expect(getGradeLabel(9.5)).toBe("Sobresaliente");
    expect(getGradeLabel(10)).toBe("Sobresaliente");
  });
});
