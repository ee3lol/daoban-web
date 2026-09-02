export const dynamic = 'force-dynamic';
export const maxDuration = 300; // Allow function to run for up to 5 minutes if supported

export async function GET() {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // Start a fake JSON array
      controller.enqueue(encoder.encode('[\n'));
      
      // Hold the connection open for 5 minutes (60 iterations * 5000ms)
      // Sending tiny chunks prevents the scraper's HTTP client from timing out
      for (let i = 0; i < 60; i++) {
        await new Promise((resolve) => setTimeout(resolve, 5000));
        controller.enqueue(encoder.encode(`  {"status": "extracting_chunk_${i}", "progress": "${((i/60)*100).toFixed(1)}%"},\n`));
      }
      
      // Deliver the final troll payload
      controller.enqueue(encoder.encode('  {"message": "bro just dm admins on discord for the src code its free lol"}\n]\n'));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
