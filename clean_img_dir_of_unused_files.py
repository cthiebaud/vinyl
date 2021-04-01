#!/usr/bin/env python3
import os
import re

dic = {}

SVGs = os.listdir('svgs')
for s in SVGs:
    # print(s)
    dic[s] = "svg"

# PNGs = os.listdir('pngs')
# for p in PNGs:
#     # print(p)
#     dic[p] = "png"

def findfiles(path, regex):
    regObj = re.compile(regex)
    res = []
    for root, dirs, fnames in os.walk(path):
        for fname in fnames:
            if regObj.match(fname):
                print(fname)
                res.append(os.path.join(root, fname))
    return res

files = findfiles('..', r'.*\.(js|css|html|md)$')

for f in files:
    for i in list(dic): # https://www.geeksforgeeks.org/python-delete-items-from-dictionary-while-iterating/
        for line in open(f, 'r'):
            if re.search(i, line):
                # print(line)
                dic.pop(i, None)
                
for k,v in dic.items():
    print('img', v, k)
    # UNCOMMENT ME
    os.remove('svgs/' + k )