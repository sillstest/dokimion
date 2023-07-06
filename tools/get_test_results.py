#!/usr/bin/python3
#
# Utility to copy surefire test results files to stdout
# so the files can be parsed by team city's XML report parsing
# build feature
#

import os, fnmatch
import sys
import glob

def locate(pattern, root=os.curdir):
   for path, dirs, files in os.walk(os.path.abspath(root)):
      for filename in fnmatch.filter(files, pattern):
         yield os.path.join(path, filename)

def main():

   if len(sys.argv) != 2:
      print("Unsupported number of arguments: ", len(sys.argv));
      sys.exit(-1);

   testResultsDir = sys.argv[1];

   for f in glob.glob(os.path.join(testResultsDir, "TEST-*.xml")):
      os.remove(f);

   for xmlFile in locate("TEST-*.xml"):
      try:
         filename = os.path.basename(xmlFile);
         with open(xmlFile, 'r') as fin:
            sys.stdout = open(os.path.join(testResultsDir, filename), "w+")
            print(fin.read());
            fin.close();

      except:
          print (xmlFile, "File write error");


if __name__ == "__main__":
   main()





