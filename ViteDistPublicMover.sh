echo ""

cd dist/public

echo "Finding files to move from dist/public/ to dist/"
find . -type f -exec cp -vR {} ../{} \; ; cd ..

echo "Deleting dist/public"
rm -rf ./public

echo "Done"