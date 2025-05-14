#!/bin/bash
files=$(find client/src -type f -name "*.tsx" | xargs grep -l "import { useAuth } from" | grep -v "auth-provider.tsx")

for file in $files; do
  echo "Updating $file"
  sed -i 's|import { useAuth } from "@/hooks/use-auth";|import { useAuth } from "@/auth-provider";|g' $file
  sed -i 's|import { useAuth } from "../../hooks/use-auth";|import { useAuth } from "../../auth-provider";|g' $file
  sed -i 's|import { useAuth } from "../hooks/use-auth";|import { useAuth } from "../auth-provider";|g' $file
  sed -i 's|import { useAuth } from "./hooks/use-auth";|import { useAuth } from "./auth-provider";|g' $file
done
