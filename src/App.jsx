import { useState } from "react";

export default function App() {
  const plates = Array.from({ length: 16 }, (_, i) => ({
    id: i + 1,
    url: `/plates/plate${String(i + 1).padStart(2, "0")}.jpg`,
  }));

  const [eye, setEye] = useState("OD");
  const [index, setIndex] = useState(0);
  const [scores, setScores] = useState({ OD: 0, OS: 0 });

  const correct = () => {
    setScores((prev) => ({ ...prev, [eye]: prev[eye] + 1 }));
    next();
  };

  const next = () => setIndex((i) => Math.min(i + 1, plates.length - 1));
  const prev = () => setIndex((i) => Math.max(i - 1, 0));

  return (
    <div style={{ fontFamily: "sans-serif", padding: "1rem" }}>
      <h1>Optic Nerve Package</h1>

      <div>
        <strong>Eye:</strong>{" "}
        <button
          onClick={() => setEye("OD")}
          style={{ fontWeight: eye === "OD" ? "bold" : "normal" }}
        >
          OD
        </button>{" "}
        <button
          onClick={() => setEye("OS")}
          style={{ fontWeight: eye === "OS" ? "bold" : "normal" }}
        >
          OS
        </button>
      </div>

      <div style={{ marginTop: "1rem" }}>
        <img
          src={plates[index].url}
          alt={`Plate ${plates[index].id}`}
          style={{ maxWidth: "100%", height: "auto" }}
        />
        <p>
          Plate {index + 1} of {plates.length}
        </p>
        <button onClick={prev} disabled={index === 0}>
          Prev
        </button>
        <button onClick={next} disabled={index === plates.length - 1}>
          Next
        </button>
        <button onClick={correct}>Correct</button>
      </div>

      <div style={{ marginTop: "1rem" }}>
        <p>OD score: {scores.OD} / 16</p>
        <p>OS score: {scores.OS} / 16</p>
      </div>

      <section style={{ marginTop: "2rem" }}>
        <h2>Other Tests</h2>
        <label>
          EOMs full?
          <input type="checkbox" defaultChecked />
        </label>
        <br />
        <label>
          Pain with EOMs?
          <input type="checkbox" />
        </label>
        <br />
        <label>
          Diplopia?
          <input type="checkbox" />
        </label>
        <br />
        <label>
          Brightness (OD% / OS%)
          <input type="text" placeholder="e.g., 100 / 80" />
        </label>
        <br />
        <label>
          Red desaturation (OD% / OS%)
          <input type="text" placeholder="e.g., 100 / 80" />
        </label>
        <br />
        <label>
          Pupils
          <input type="text" placeholder="PERRLA or APD" />
        </label>
        <br />
        <label>
          Optic nerve exam
          <input
            type="text"
            placeholder="pink, perfused, sharp margins"
          />
        </label>
      </section>

      <section style={{ marginTop: "2rem" }}>
        <h2>Summary</h2>
        <textarea
          rows={8}
          style={{ width: "100%" }}
          placeholder="Paste into EMR..."
        ></textarea>
      </section>
    </div>
  );
}
