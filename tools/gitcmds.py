#!/usr/bin/python3
#
# Utility to update git
#

import os
import sys


def main():

   if len(sys.argv) != 2:
      print("Unsupported number of arguments: ", len(sys.argv));
      sys.exit(-1);

   testResultsDir = sys.argv[1];

   os.system("/usr/bin/git add " + os.path.join(testResultsDir, "*"));
   os.system("/usr/bin/git commit -m \"new test results files\"");
   os.system("/usr/bin/git pull");
   os.system("/usr/bin/git push");

if __name__ == "__main__":
   main()





