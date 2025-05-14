// Test script for the API endpoints
const testAPI = async () => {
  try {
    // Test search with 'doe' - should return both John Doe and Jane Doe
    console.log('\n--- Testing search with "doe" ---');
    const doeResponse = await fetch('http://localhost:5000/api/users/search?q=doe');
    const doeResults = await doeResponse.json();
    console.log(`Found ${doeResults.length} users matching "doe":`);
    doeResults.forEach(user => {
      console.log(`- ${user.displayName} (@${user.username})`);
    });

    // Test search with 'john' - should return John Doe
    console.log('\n--- Testing search with "john" ---');
    const johnResponse = await fetch('http://localhost:5000/api/users/search?q=john');
    const johnResults = await johnResponse.json();
    console.log(`Found ${johnResults.length} users matching "john":`);
    johnResults.forEach(user => {
      console.log(`- ${user.displayName} (@${user.username})`);
    });

    // Test search with 'jane' - should return Jane Doe
    console.log('\n--- Testing search with "jane" ---');
    const janeResponse = await fetch('http://localhost:5000/api/users/search?q=jane');
    const janeResults = await janeResponse.json();
    console.log(`Found ${janeResults.length} users matching "jane":`);
    janeResults.forEach(user => {
      console.log(`- ${user.displayName} (@${user.username})`);
    });

    // Test search with 'collect' - should return users with "collect" in their bio
    console.log('\n--- Testing search with "collect" ---');
    const collectResponse = await fetch('http://localhost:5000/api/users/search?q=collect');
    const collectResults = await collectResponse.json();
    console.log(`Found ${collectResults.length} users matching "collect":`);
    collectResults.forEach(user => {
      console.log(`- ${user.displayName} (@${user.username}): "${user.bio}"`);
    });

    // Test search with a very short query - should return an error
    console.log('\n--- Testing search with a short query "a" ---');
    const shortResponse = await fetch('http://localhost:5000/api/users/search?q=a');
    const shortResult = await shortResponse.json();
    console.log('Response status:', shortResponse.status);
    console.log('Response body:', shortResult);

    // Get user by username
    console.log('\n--- Testing get user by username "johndoe" ---');
    const usernameResponse = await fetch('http://localhost:5000/api/users/johndoe');
    const usernameResult = await usernameResponse.json();
    console.log('User:', usernameResult ? `${usernameResult.displayName} (@${usernameResult.username})` : 'Not found');

    // Testing get user followers (requires login, just confirm endpoint is correctly configured)
    console.log('\n--- Testing get user followers by username "johndoe" ---');
    const followersResponse = await fetch('http://localhost:5000/api/users/johndoe/followers');
    console.log('Response status:', followersResponse.status);
    if (followersResponse.status === 200) {
      const followers = await followersResponse.json();
      console.log(`User has ${followers.length} followers`);
    } else {
      console.log('This endpoint is protected or requires login');
    }

    // Testing get user following (requires login, just confirm endpoint is correctly configured)
    console.log('\n--- Testing get user following by username "johndoe" ---'); 
    const followingResponse = await fetch('http://localhost:5000/api/users/johndoe/following');
    console.log('Response status:', followingResponse.status);
    if (followingResponse.status === 200) {
      const following = await followingResponse.json();
      console.log(`User is following ${following.length} users`);
    } else {
      console.log('This endpoint is protected or requires login');
    }

  } catch (error) {
    console.error('Error during tests:', error);
  }
};

testAPI();