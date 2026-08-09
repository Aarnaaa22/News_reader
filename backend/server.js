import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

const PORT = 5000;

app.post("/tts", async (req, res) => {
  try {
    const { text, language } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }

    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/CwhRBWXzGAHq8TQ4Fs17`,
      {
        text: text,
        model_id: "eleven_multilingual_v2"
      },
      {
        headers: {
          "xi-api-key": process.env.ELEVEN_API_KEY,
          "Content-Type": "application/json"
        },
        responseType: "arraybuffer" // important for audio
      }
    );

    res.set({
      "Content-Type": "audio/mpeg"
    });

    res.send(response.data);

  } catch (error) {
    const errorDetails = error.response ? error.response.data : error.message;
    console.error("TTS Error:", errorDetails);
    let detailsString = typeof errorDetails === 'object' && errorDetails instanceof Buffer ? errorDetails.toString('utf8') : JSON.stringify(errorDetails);
    res.status(500).json({ error: "Failed to generate speech", details: detailsString });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
