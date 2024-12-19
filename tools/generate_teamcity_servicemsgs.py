#!/usr/bin/python3
#
# Utility to copy surefire test results files to stdout
# so the files can be parsed by team city's XML report parsing
# build feature
#

import os
import sys
import glob
import xml.etree.ElementTree as ET

def main():


   # find all test results xml files
   for xmlFile in glob.glob(os.path.join("**/", "TEST-*.xml"), recursive=True):

      tree = ET.parse(xmlFile);
      root = tree.getroot();
      noTests = root.get("tests");
      noErrors = root.get("errors");
      noSkipped = root.get("skipped");
      noFailures = root.get("failures");

      print("##teamcity[testSuiteStarted name='" + root.get("name") + "']");


      for i in range(0, int(noTests)-int(noErrors)):
         print("##teamcity[testStarted name='" + "test" + str(i+1) + "']");
         print("##teamcity[testFinished name='" + "test" + str(i+1) + "']");

      for i in range(0, int(noErrors)):
         print("##teamcity[testStarted name='" + "test" + str(i+1) + "']");
         print("##teamcity[testFailed name='" + "test" + str(i+1) + "']");


      print("##teamcity[testSuiteFinished name='" + root.get("name") + "']");

      print("noTests = ", noTests);
      print("noErrors = ", noErrors);
      print("noSkipped = ", noSkipped);


if __name__ == "__main__":
   main()





