import { describe, it, expect } from "vitest";

// We'll test the new parseTatoebaHtml function
// (imported after we create it)
import { parseTatoebaHtml } from "../tatoeba";

const sampleHtml = `
<div class="sentence-and-translations md-whiteframe-1dp"
  ng-init="vm.init([], {&quot;id&quot;:6075521,&quot;text&quot;:&quot;This is common.&quot;,&quot;lang&quot;:&quot;eng&quot;}, [[{&quot;id&quot;:6075518,&quot;text&quot;:&quot;这很常见。&quot;,&quot;lang&quot;:&quot;cmn&quot;}]], 'cmn')">
</div>
<div class="sentence-and-translations md-whiteframe-1dp"
  ng-init="vm.init([], {&quot;id&quot;:312364,&quot;text&quot;:&quot;She lacks common sense.&quot;,&quot;lang&quot;:&quot;eng&quot;}, [[{&quot;id&quot;:1746045,&quot;text&quot;:&quot;她缺乏常识。&quot;,&quot;lang&quot;:&quot;cmn&quot;}]], 'cmn')">
</div>
`;

describe("parseTatoebaHtml", () => {
  it("extracts English sentences from ng-init attributes", () => {
    const result = parseTatoebaHtml(sampleHtml, 10);
    expect(result.length).toBe(2);
    expect(result[0].english).toBe("This is common.");
    expect(result[1].english).toBe("She lacks common sense.");
  });

  it("extracts Chinese translations from ng-init attributes", () => {
    const result = parseTatoebaHtml(sampleHtml, 10);
    expect(result[0].chinese).toBe("这很常见。");
    expect(result[1].chinese).toBe("她缺乏常识。");
  });

  it("generates unique IDs for each sentence", () => {
    const result = parseTatoebaHtml(sampleHtml, 10);
    expect(result[0].id).toMatch(/^tatoeba-\d+-0$/);
    expect(result[1].id).toMatch(/^tatoeba-\d+-1$/);
  });

  it("assigns source type tatoeba", () => {
    const result = parseTatoebaHtml(sampleHtml, 10);
    expect(result[0].source.type).toBe("tatoeba");
    expect(result[1].source.type).toBe("tatoeba");
  });

  it("tags sentences based on content", () => {
    const result = parseTatoebaHtml(sampleHtml, 10);
    expect(result[0].tags).toContain("生活");
    expect(result[1].tags).toContain("生活");
  });

  it("respects the limit parameter", () => {
    const result = parseTatoebaHtml(sampleHtml, 1);
    expect(result.length).toBe(1);
  });

  it("skips sentences shorter than 3 words", () => {
    const shortHtml = `
<div class="sentence-and-translations"
  ng-init="vm.init([], {&quot;id&quot;:1,&quot;text&quot;:&quot;Hello.&quot;,&quot;lang&quot;:&quot;eng&quot;}, [[{&quot;id&quot;:2,&quot;text&quot;:&quot;你好。&quot;,&quot;lang&quot;:&quot;cmn&quot;}]], 'cmn')">
</div>
    `;
    const result = parseTatoebaHtml(shortHtml, 10);
    expect(result.length).toBe(0);
  });

  it("skips sentences longer than 200 characters", () => {
    const longText = "a ".repeat(101);
    const longHtml = `
<div class="sentence-and-translations"
  ng-init="vm.init([], {&quot;id&quot;:1,&quot;text&quot;:&quot;${longText}&quot;,&quot;lang&quot;:&quot;eng&quot;}, [[{&quot;id&quot;:2,&quot;text&quot;:&quot;长句。&quot;,&quot;lang&quot;:&quot;cmn&quot;}]], 'cmn')">
</div>
    `;
    const result = parseTatoebaHtml(longHtml, 10);
    expect(result.length).toBe(0);
  });
});
