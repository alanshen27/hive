import { NextResponse } from 'next/server'
import { storage, bucket } from '@/lib/google-cloud-storage'

export async function GET() {
  try {
    console.log('Testing service account permissions...');
    
    // Test 1: Check if we can list files
    console.log('Test 1: Listing files...');
    const [files] = await bucket.getFiles({ maxResults: 1 });
    console.log('✅ Can list files');
    
    // Test 2: Check if we can create a file (upload test)
    console.log('Test 2: Creating test file...');
    const testFilename = `test-${Date.now()}.txt`;
    const testFile = bucket.file(testFilename);
    
    await testFile.save('Hello World!', {
      metadata: {
        contentType: 'text/plain',
      },
      public: true,
    });
    console.log('✅ Can create files');
    
    // Test 3: Check if we can make files public
    console.log('Test 3: Making file public...');
    await testFile.makePublic();
    console.log('✅ Can make files public');
    
    // Test 4: Check if we can get metadata
    console.log('Test 4: Getting file metadata...');
    const [metadata] = await testFile.getMetadata();
    console.log('✅ Can get file metadata');
    
    // Test 5: Check if we can delete files
    console.log('Test 5: Deleting test file...');
    await testFile.delete();
    console.log('✅ Can delete files');
    
    return NextResponse.json({
      success: true,
      message: 'All permission tests passed!',
      tests: [
        'Can list files',
        'Can create files', 
        'Can make files public',
        'Can get file metadata',
        'Can delete files'
      ]
    });
    
  } catch (error) {
    console.error('Permission test error:', error);
    return NextResponse.json({
      error: 'Permission test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      code: (error as any)?.code,
      status: (error as any)?.status
    }, { status: 500 });
  }
}
