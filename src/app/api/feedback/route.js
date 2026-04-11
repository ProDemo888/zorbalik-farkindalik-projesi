import { NextResponse } from "next/server";

const SYSTEM_PROMPT = `Sen çok sıcakkanlı, empati kurabilen ancak analiz yeteneği yüksek bir Rehberlik Öğretmenisin.

Görevin: Bir lise öğrencisinin zorbalık senaryosuna verdiği 3 ayrı cevabı okuyup HER BİR CEVABA ÖZEL yapıcı, geliştirici ve psikolojik açıdan doğru bir "değerlendirme" sunmaktır.

Kurallar:
1. Çok nazik, teşvik edici ve sıcak bir Türkçe kullan.
2. Bir sohbet robotu (chatbot) gibi davranma. Karşılıklı bir konuşma başlatmaya çalışma.
3. Cevaplarını kesinlikle öğrenciye bir soru sorarak veya "seninle konuşmaya hazırım", "ne düşünüyorsun?" gibi ifadelerle bitirme.
4. Öğrencinin doğru yaptığı tespitleri veya gösterdiği empatiyi takdir et. Yanlış veya eksik düşündüğü kısımları sert olmadan düzelt.
5. Her geri bildirim kendi içinde tam ve bitmiş bir analiz olmalıdır.
6. ÇIKTIN KESİNLİKLE JSON OLMALIDIR. Her cevap için bir geri bildirim ve bir kategori (SADECE "doğru", "geliştirilebilir" VEYA "yanlış") döndür:
{
  "feedback_1": "...", "category_1": "geliştirilebilir",
  "feedback_2": "...", "category_2": "doğru",
  "feedback_3": "...", "category_3": "yanlış"
}`;

export async function POST(request) {
  try {
    const { scenario, answers, studentName } = await request.json();

    if (!scenario || !answers || answers.length !== 3) {
      return NextResponse.json(
        { error: "Geçersiz istek." },
        { status: 400 }
      );
    }

    const userMessage = `Senaryo: "${scenario.title}"

Hikaye:
${scenario.story}

Sorular ve Öğrencinin Cevapları:

Soru 1: ${scenario.questions[0]}
Cevap 1: ${answers[0]}

Soru 2: ${scenario.questions[1]}
Cevap 2: ${answers[1]}

Soru 3: ${scenario.questions[2]}
Cevap 3: ${answers[2]}

Lütfen her bir soruya verdiği cevap için JSON formatında yapıcı bir geri bildirim ver.`;

    const apiKey = process.env.OPENROUTER_API_KEY;
    const model = process.env.OPENROUTER_MODEL || "openai/gpt-4o";

    if (!apiKey) {
      return NextResponse.json(
        { error: "API anahtarı yapılandırılmamış." },
        { status: 500 }
      );
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
        "X-Title": "Empati ve Zorbalik Farkindalik",
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
        temperature: 0.7,
        max_tokens: 1500,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error("OpenRouter error:", errBody);
      return NextResponse.json(
        { error: "AI servisi şu an yanıt veremiyor." },
        { status: 502 }
      );
    }

    const data = await response.json();
    let feedbackText = data.choices?.[0]?.message?.content || "";
    
    let parsedFeedback;
    try {
      // Robust JSON extraction
      const jsonMatch = feedbackText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
         parsedFeedback = JSON.parse(jsonMatch[0]);
         if(!parsedFeedback.feedback_1 && !parsedFeedback.feedback_2 && !parsedFeedback.feedback_3) {
            throw new Error("Missing keys");
         }
      } else {
         throw new Error("No JSON found");
      }
    } catch(e) {
      console.warn("JSON parsing failed, falling back to raw text:", e);
      parsedFeedback = {
        feedback_1: feedbackText,
        feedback_2: "Ek geri bildirim oluşturulamadı.",
        feedback_3: "Ek geri bildirim oluşturulamadı.",
        category_1: "geliştirilebilir",
        category_2: "geliştirilebilir",
        category_3: "geliştirilebilir"
      };
    }

    const feedbackArray = [
      parsedFeedback.feedback_1 || "",
      parsedFeedback.feedback_2 || "",
      parsedFeedback.feedback_3 || ""
    ];

    const categoryArray = [
      parsedFeedback.category_1 || "geliştirilebilir",
      parsedFeedback.category_2 || "geliştirilebilir",
      parsedFeedback.category_3 || "geliştirilebilir"
    ];

    // Return stringified array so the DB schema (TEXT) still accepts it perfectly
    return NextResponse.json({ 
      feedback: JSON.stringify(feedbackArray),
      category: JSON.stringify(categoryArray)
    });
  } catch (err) {
    console.error("Feedback API error:", err);
    return NextResponse.json(
      { error: "Sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}
