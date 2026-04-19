import { NextResponse } from "next/server";

const GEMINI_ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent";

export async function POST(request) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        error: "GEMINI_API_KEY is missing. Add it in your Vercel environment variables."
      },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { prompt, referenceImages = [] } = body;

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required." }, { status: 400 });
    }

    const parts = [{ text: prompt }];

    for (const image of referenceImages) {
      if (image?.data && image?.mimeType) {
        parts.push({
          inlineData: {
            mimeType: image.mimeType,
            data: image.data
          }
        });
      }
    }

    const response = await fetch(GEMINI_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey
      },
      body: JSON.stringify({
        contents: [{ parts }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          error: data?.error?.message || "Gemini image generation failed.",
          raw: data
        },
        { status: response.status }
      );
    }

    const imagePart = data?.candidates?.[0]?.content?.parts?.find((part) => part.inlineData);

    return NextResponse.json({
      image: imagePart
        ? {
            mimeType: imagePart.inlineData.mimeType,
            data: imagePart.inlineData.data
          }
        : null,
      raw: data
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unexpected generation error."
      },
      { status: 500 }
    );
  }
}
