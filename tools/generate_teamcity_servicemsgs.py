#!/usr/bin/python3
#
# Utility to copy surefire test results files to stdout
# so the files can be parsed by team city's XML report parsing
# build feature
#

import os, fnmatch
import sys
import glob

def main():

   # find all test results xml files
   for xmlFile in glob.glob(os.path.join("**/", "TEST-*.xml"), recursive=True):
      print("##teamcity[importData type='surefire' path='" + xmlFile + "' parseOutOfDate='true']");



if __name__ == "__main__":
   main()





