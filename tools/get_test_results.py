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
import random

def locate(pattern, root=os.curdir):
   for path, dirs, files in os.walk(os.path.abspath(root)):
      for filename in fnmatch.filter(files, pattern):
         return os.path.join(path, filename)

def main():

   if len(sys.argv) != 2:
      print("Unsupported number of arguments: ", len(sys.argv));
      sys.exit(-1);

   quackAbsHomeDir = os.path.join(os.path.dirname(__file__), "../");
   testResultsDir = sys.argv[1];

   testResultsFileNamePattern = "TEST-*.xml";
   for xmlFile in glob.glob(os.path.join(testResultsDir, testResultsFileNamePattern), recursive=True):
       os.system("/usr/bin/git rm " + xmlFile);

   # copy all surefire test results file to test results dir
   for xmlFile in glob.glob("**/" + testResultsFileNamePattern, recursive=True):
       srcXmlFileName = os.path.basename(xmlFile);
       destXmlDir = os.path.join(quackAbsHomeDir, testResultsDir);
       shutil.copy(xmlFile, destXmlDir);


   for xmlFile in glob.glob(testResultsDir + "/**/" + testResultsFileNamePattern, recursive=True):
       srcXmlFileName = os.path.basename(xmlFile);
       destXmlDir = os.path.join(quackAbsHomeDir, testResultsDir);
       os.system("/usr/bin/git add " + os.path.abspath(os.path.join(destXmlDir, srcXmlFileName)));

   # save new test results files to test results dir
   n = random.randint(0, 1000000);
   with open( os.path.join(testResultsDir, "__test"), "w+") as fout:
      fout.write(str(n));
      fout.close();
      os.system("/usr/bin/git add " + os.path.join(testResultsDir, "__test"));

   os.system("/usr/bin/git commit -m \"new test results files\"");
   os.system("/usr/bin/git pull");
   os.system("/usr/bin/git push");

if __name__ == "__main__":
   main()





