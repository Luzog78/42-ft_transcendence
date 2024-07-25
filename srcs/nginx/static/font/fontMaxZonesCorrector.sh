#!/bin/bash


if [ "$#" -eq 0 ]; then
    echo "Usage: $0 <fontfile1> <fontfile2> ..."
    exit 1
fi


if ! [ -x "$(command -v ttx)" ]; then
    echo 'Error: ttx is not installed.' >&2
    echo '[SUDO REQUIRED] Want to install it? (Y/n)' >&2
    read answer
    if [ "$answer" == "Y" ] || [ "$answer" == "y" ]; then
        sudo apt-get install fonttools
        if ! [ -x "$(command -v ttx)" ]; then
            echo 'Error: fonttools installation failed.' >&2
            exit 1
        fi
    else
        exit 1
    fi
fi


for file in "$@"; do
    ttx -o $file.ttx $file
    sed -i 's/maxZones value="0"/maxZones value="1"/g' $file.ttx
    ttx -o $file $file.ttx
    rm $file.ttx
done
