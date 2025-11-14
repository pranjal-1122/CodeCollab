// This file will hold the logic for interacting with the Piston API

export const PISTON_API_URL = "https://emkc.org/api/v2/piston/execute";

export const getPistonLanguage = (lang) => {
  switch (lang.toLowerCase()) {
    case 'python':
      // --- THIS IS THE FIX ---
      return { language: 'python', version: '3.10.0', mainFile: 'main.py' };
    case 'javascript':
      return { language: 'javascript', version: '18.15.0', mainFile: 'main.js' };
    case 'java':
      // This is the most important one!
      return { language: 'java', version: '15.0.2', mainFile: 'Main.java' };
    case 'c++':
      return { language: 'cpp', version: '10.2.0', mainFile: 'main.cpp' };
    // --- END OF FIX ---
    default:
      return { language: 'python', version: '3.10.0', mainFile: 'main.py' };
  }
};

// --- THIS IS THE NEW FUNCTION ---
export const getLanguageBoilerplate = (lang) => {
  switch (lang.toLowerCase()) {
    case 'python':
      return `# Your code here
# Read input using input()
# Print output using print()

def solve():
  # Example: read a line
  # line = input()
  # print(f"You entered: {line}")
  pass

solve()
`;
    case 'javascript':
      return `// Your code here
// Read input using require('fs').readFileSync(0, 'utf-8')
// Print output using console.log()

function solve() {
  // Example:
  // const fs = require('fs');
  // const input = fs.readFileSync(0, 'utf-8');
  // console.log(\`You entered: \${input}\`);
}

solve();
`;
    case 'java':
      return `import java.util.*;
import java.io.*;

// The class MUST be named Main
public class Main {
  public static void main(String[] args) {
    Scanner sc = new Scanner(System.in);
    
    // Your code here
    // Read input using sc.nextLine(), sc.nextInt(), etc.
    
    // Example: read a line
    // String line = sc.nextLine();
    // System.out.println("You entered: " + line);
    
    // Print output using System.out.println()
    
    sc.close();
  }
}
`;
    case 'c++':
      return `#include <iostream>
#include <vector>
#include <string>

using namespace std;

int main() {
  // Your code here
  // Read input using cin
  
  // Example: read a line
  // string line;
  // getline(cin, line);
  // cout << "You entered: " << line << endl;
  
  // Print output using cout
  
  return 0;
}
`;
    default:
      return `// Welcome! Start coding...`;
  }
};
// --- END OF NEW FUNCTION ---