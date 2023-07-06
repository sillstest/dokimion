#!/usr/bin/python3
#
# Utility to copy surefire test results files to stdout
# so the files can be parsed by team city's XML report parsing
# build feature
#

import os, fnmatch
import sys
import glob
import shutil

def locate(pattern, root=os.curdir):
   for path, dirs, files in os.walk(os.path.abspath(root)):
      for filename in fnmatch.filter(files, pattern):
         yield os.path.join(path, filename)

def main():

   if len(sys.argv) != 2:
      print("Unsupported number of arguments: ", len(sys.argv));
      sys.exit(-1);

   quackAbsHomeDir = os.path.join(os.path.dirname(__file__), "../");
   testResultsDir = sys.argv[1];

   # delete all test result files in test results dir
   testResultsFileNamePattern = "TEST-*.xml";
   for f in glob.glob(os.path.join(quackAbsHomeDir, testResultsDir, testResultsFileNamePattern)):
      os.remove(f);

   # copy all surefire test results file to test results dir
   for xmlFile in locate(testResultsFileNamePattern):
      try:
         srcXmlFileName = os.path.basename(xmlFile);
         destXmlFileName = os.path.join(quackAbsHomeDir, testResultsDir, srcXmlFileName);

         shutil.copy(xmlFile, destXmlFileName);

      except:
          print (xmlFile, "File write error");


   # save new test results files to test results dir
   os.chdir(os.path.join(quackAbsHomeDir, testResultsDir));
   os.system("/usr/bin/git add *");
   os.system("/usr/bin/git commit -m \"new test results files\"");
   os.system("/usr/bin/git pull");
   os.system("/usr/bin/git push");

if __name__ == "__main__":
   main()





