export async function POST(req: Request) {
  const { message } = await req.json();

  const res = await fetch("http://localhost:3000/api/generate-image", {
    method: "POST",
    body: JSON.stringify({ prompt: message }),
  });

  const data = await res.json();

  return Response.json({ response: data });
}